import sys
import json
import unittest
from collections import defaultdict
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from build_trajectories import classify_field, classify_function, FIELDS, Organisations, university_name_evidence

class ClassificationEvidence(unittest.TestCase):
    def field(self,role,department=''):
        return FIELDS[classify_field({'role':role,'department':department})[0]][0]

    def test_generic_phd_does_not_become_philosophy(self):
        self.assertEqual(self.field('Doctor of Philosophy'),'unknown')
        self.assertEqual(self.field('Doctorate of Philosophy'),'unknown')
        self.assertEqual(self.field('Doctorate in Philosophy'),'unknown')
        self.assertEqual(self.field('Doctor of Philosophy','Physics'),'physics')
        self.assertEqual(self.field('Doctor of Philosophy in Philosophy'),'philosophy')
        self.assertEqual(self.field('Doctorat en philosophie'),'philosophy')

    def test_missing_and_multiple_fields_remain_explicit(self):
        self.assertEqual(self.field('PhD'),'unknown')
        self.assertEqual(self.field('PhD','Physics and Chemistry'),'multiple')
        self.assertEqual(self.field('Doctorado en Historia'),'history')
        self.assertEqual(self.field('Doutorado','Ciências Biológicas'),'biology')

    def test_postdoc_not_inferred_from_fellow(self):
        self.assertEqual(classify_function('Post-doctoral researcher'),1)
        self.assertEqual(classify_function('Research fellow'),4)
        self.assertEqual(classify_function('Fellow'),0)
        self.assertEqual(classify_function('Data scientist'),3)

    def test_ror_ambiguous_names_stay_unmatched_and_country_is_not_overwritten(self):
        r=Organisations.__new__(Organisations)
        r.rows=[{'id':'https://ror.org/test1','types':['company']},{'id':'https://ror.org/test2','types':['education']}]
        r.by_id={'test1':0};r.by_grid={};r.by_name=defaultdict(set,{('example organisation','GB'):{0,1},('example university','DE'):{1}})
        r.by_key=defaultdict(set);r.by_acronym=defaultdict(set)
        self.assertEqual(r.resolve('','','Example Organisation','GB')['sector'],0)
        self.assertEqual(r.resolve('','','Example University','DE')['sector'],1)
        a={'organizationId':'https://ror.org/test1','organizationIdType':'ROR','organization':'Example','country':'FR','role':'Scientist'}
        enriched=r.enrich(a)
        self.assertEqual(enriched['country'],'FR')
        self.assertEqual(enriched['classification']['sector'],2)

class OrganisationRegressions(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # ROR v2.12 / CC0: real organisations from the published data edition.
        cls.r=Organisations(json.loads((Path(__file__).parent/'fixtures/ror-organisations.json').read_text()))

    def test_lisbon_faculties_in_both_languages_are_university_units(self):
        for name in ['Universidade de Lisboa Faculdade de Direito',
                     'Faculdade de Ciências da Universidade de Lisboa',
                     'Faculty of Sciences, University of Lisbon',
                     'Universidade de Lisboa Instituto Superior Técnico']:
            with self.subTest(name=name):
                c=self.r.resolve('70878','RINGGOLD',name,'PT')
                self.assertEqual(c['sector'],1)
                self.assertEqual(c['method'],'university-unit')
                self.assertEqual(c['ror'],'https://ror.org/01c27hj86')
                self.assertEqual(c['rorScope'],'parent')

    def test_nova_is_not_merged_into_lisbon(self):
        c=self.r.resolve('','','Universidade Nova de Lisboa Faculdade de Ciências Médicas','PT')
        self.assertEqual(c['ror'],'https://ror.org/02xankh89')

    def test_polytechnic_unit_uses_the_known_educational_parent(self):
        c=self.r.resolve('','','Instituto Politécnico de Lisboa Instituto Superior de Engenharia de Lisboa','PT')
        self.assertEqual(c['sector'],1)
        self.assertEqual(c['method'],'university-unit')

    def test_punctuation_and_leading_article_are_not_new_organisations(self):
        c=self.r.resolve('','','The University of California Berkeley','US')
        self.assertEqual(c['method'],'normalised-name-country')
        self.assertEqual(c['ror'],'https://ror.org/01an7q238')

    def test_sector_can_be_known_without_inventing_a_campus_identity(self):
        c=self.r.resolve('','','Purdue University','US')
        self.assertEqual(c,{'sector':1,'method':'education-name','ror':''})

    def test_university_institute_does_not_require_an_english_name(self):
        c=self.r.resolve('','','ISCTE-Instituto Universitário de Lisboa','PT')
        self.assertEqual(c['sector'],1)
        self.assertEqual(c['ror'],'')

    def test_medical_schools_are_education_even_with_ror_other_type(self):
        for name in ['Yale School of Medicine','Johns Hopkins University School of Medicine','Duke University School of Medicine']:
            c=self.r.resolve('','',name,'US')
            self.assertEqual(c['sector'],1)
            self.assertEqual(c['sectorRule'],'education-name')
            self.assertIn('other',c['rorTypes'])

    def test_incorrect_grid_does_not_make_trinity_a_company(self):
        c=self.r.resolve('grid.472530.7','GRID','Trinity College Dublin','IE')
        self.assertEqual(c['sector'],1)
        self.assertEqual(c['method'],'name-id-conflict')
        self.assertEqual(c['ror'],'https://ror.org/02tyrky19')
        self.assertEqual(c['conflictingRor'],'https://ror.org/01dcaj468')

    def test_no_university_inference_for_publishers_hospitals_or_mixed_employers(self):
        for name in ['Cambridge University Press','Oxford University Hospital',
                     'University Health Network','University Research Foundation',
                     'University of Lisbon / Acme Ltd','University of Lisbon; Google',
                     'University Consultants Inc','University of Lisbon and CNRS']:
            with self.subTest(name=name):
                self.assertFalse(university_name_evidence(name))
                self.assertEqual(self.r.resolve('','',name,'PT')['sector'],0)

if __name__=='__main__':unittest.main()
