import sys
import unittest
from collections import defaultdict
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from build_trajectories import classify_field, classify_function, FIELDS, Organisations

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
        self.assertEqual(r.resolve('','','Example Organisation','GB')['method'],'unmatched')
        self.assertEqual(r.resolve('','','Example University','DE')['sector'],1)
        a={'organizationId':'https://ror.org/test1','organizationIdType':'ROR','organization':'Example','country':'FR','role':'Scientist'}
        enriched=r.enrich(a)
        self.assertEqual(enriched['country'],'FR')
        self.assertEqual(enriched['classification']['sector'],2)

if __name__=='__main__':unittest.main()
