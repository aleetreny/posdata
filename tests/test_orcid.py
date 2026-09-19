"""Evidence rules: doctoral degrees, chronology and incomplete date precision."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from parse_orcid import is_doctorate, before, completed_doctorate, later_job


class DoctoralEvidence(unittest.TestCase):
    def test_explicit_research_doctorates_across_languages(self):
        for label in ['Ph.D. in Physics', 'DPhil', 'Doctor of Philosophy',
                      'Doctorat en histoire', 'Doctorado en Economía',
                      'Doutor em Ciências', 'Dottorato di ricerca', 'Dr.-Ing.',
                      'Dr. rer. nat.', 'Promotion in Chemie', 'Doutoramento em História',
                      'Doktor der Naturwissenschaften', 'Doctoraat', 'Doktorsexamen']:
            with self.subTest(label=label):
                self.assertTrue(is_doctorate(label))

    def test_students_professional_degrees_and_honorary_not_graduates(self):
        for label in ['PhD candidate', 'PhD student', 'Doctorando en Física',
                      'PhD in progress', 'Honorary PhD', 'Doctor honoris causa',
                      'MD', 'Doctor of Medicine', 'MBA', 'MSc', 'Professor', 'Dr.']:
            with self.subTest(label=label):
                self.assertFalse(is_doctorate(label))

    def test_visiting_stays_and_postdoctoral_education_are_not_a_host_phd(self):
        for label in ['Doutorado Sanduíche', 'Visiting PhD', 'Doctoral degree exchange',
                      'Post-doctoral degree', 'Post Doctorate', 'PhD researcher visitante']:
            with self.subTest(label=label):self.assertFalse(is_doctorate(label))
        self.assertTrue(is_doctorate('PhD in Mathematics'))

    def test_missing_month_is_not_january(self):
        self.assertFalse(before([2020, 0, 0], [2020, 9, 1]))
        self.assertFalse(before([2020, 9, 0], [2020, 9, 20]))
        self.assertTrue(before([2019, 0, 0], [2020, 0, 0]))
        self.assertTrue(before([2020, 8, 0], [2020, 9, 0]))

    def test_future_or_undated_doctorate_does_not_qualify(self):
        self.assertFalse(completed_doctorate({'end': None}))
        self.assertFalse(completed_doctorate({'end': [2026, 0, 0]}))
        self.assertFalse(completed_doctorate({'end': [2025, 12, 1]}))
        self.assertFalse(completed_doctorate({'start': [2020, 2, 0], 'end': [2019, 0, 0]}))
        self.assertTrue(completed_doctorate({'start': [2016, 0, 0], 'end': [2020, 0, 0]}))

    def test_later_employment_requires_observed_year_and_real_role(self):
        phd = {'end': [2020, 0, 0]}
        valid = {'start': [2021, 1, 1], 'end': None, 'role': 'Data scientist'}
        self.assertTrue(later_job(valid, phd))
        self.assertFalse(later_job({**valid, 'start': None}, phd))
        self.assertFalse(later_job({**valid, 'start': [2018, 0, 0]}, phd))
        self.assertFalse(later_job({**valid, 'start': [2025, 12, 1]}, phd))
        self.assertFalse(later_job({**valid, 'role': 'PhD student'}, phd))
        self.assertTrue(later_job({**valid, 'end': [2021, 0, 0]}, phd))

    def test_known_months_do_not_turn_pre_doctoral_jobs_into_later_jobs(self):
        phd = {'end': [2020, 9, 1]}
        job = {'start': [2020, 3, 1], 'end': [2020, 6, 1], 'role': 'Researcher'}
        self.assertFalse(later_job(job, phd))
        self.assertFalse(later_job({**job, 'start': [2020, 0, 0]}, phd))
        self.assertTrue(later_job({**job, 'start': [2020, 0, 0], 'end': None}, phd))
        self.assertTrue(later_job({**job, 'start': [2020, 10, 1], 'end': None}, phd))


if __name__ == '__main__':
    unittest.main()
