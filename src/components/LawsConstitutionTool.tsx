import React, { useState, useMemo } from 'react';
import {
  Scale,
  BookOpen,
  ShieldAlert,
  Gavel,
  FileText,
  HelpCircle,
  Send,
  Languages,
  PhoneCall,
  ExternalLink,
  Copy,
  Check,
  Search,
  AlertTriangle,
  Download,
  Sparkles,
  RefreshCw,
  Bookmark,
  Info,
  ArrowRight,
  FileCheck2,
  Code2,
  BookMarked,
  Scroll,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { BookView } from './BookView.tsx';

// --------------------------------------------------------------------------
// TYPES & DATA STRUCTURES
// --------------------------------------------------------------------------
export type TabType = 'codex_book' | 'solver' | 'constitution' | 'bns' | 'cyber_consumer' | 'generator' | 'helplines';
export type LanguageMode = 'telugu' | 'english' | 'bilingual';

export interface ConstitutionCodexItem {
  id: string;
  part: string;
  partTitle: string;
  chapter?: string;
  articleNumber: string;
  heading: string;
  headingTe: string;
  content: string; // Exact legal text preserving clauses (1), (2), (a), (b)
  simplifiedNotes: string; // Key takeaway
  simplifiedNotesTe: string; // Telugu translation
  caseLaws?: string; // Landmark case laws / exceptions
  amendments?: string; // Historical context / amendments up to 2026
}

export interface LegalEntry {
  id: string;
  category: 'constitution' | 'criminal_bns' | 'cyber' | 'consumer' | 'civil';
  titleEn: string;
  titleTe: string;
  sectionCode: string;
  formerCode?: string;
  meaningEn: string;
  meaningTe: string;
  provisionsEn: string[];
  provisionsTe: string[];
  remediesEn: string[];
  remediesTe: string[];
  landmarkCase?: string;
  officialPortal?: string;
}

// --------------------------------------------------------------------------
// CONSTITUTION CODEX: COMPREHENSIVE DIGITAL LAW BOOK (UPDATES UP TO 2026)
// --------------------------------------------------------------------------
export const CONSTITUTION_CODEX: ConstitutionCodexItem[] = [
  {
    id: 'preamble',
    part: 'THE PREAMBLE',
    partTitle: 'PHILOSOPHY OF THE CONSTITUTION',
    articleNumber: 'Preamble',
    heading: 'Preamble to the Constitution of India',
    headingTe: 'భారత రాజ్యాంగ పీఠిక (ప్రవేశిక)',
    content:
      'WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC and to secure to all its citizens:\nJUSTICE, social, economic and political;\nLIBERTY of thought, expression, belief, faith and worship;\nEQUALITY of status and of opportunity;\nand to promote among them all\nFRATERNITY assuring the dignity of the individual and the unity and integrity of the Nation;\nIN OUR CONSTITUENT ASSEMBLY this twenty-sixth day of November, 1949, do HEREBY ADOPT, ENACT AND GIVE TO OURSELVES THIS CONSTITUTION.',
    simplifiedNotes:
      'The Preamble is the key and identity card of the Indian Constitution, declaring India as an independent, socialist, secular, democratic republic dedicated to justice, liberty, equality, and fraternity.',
    simplifiedNotesTe:
      'పీఠిక భారత రాజ్యాంగానికి ఆత్మ మరియు మార్గదర్శక దీపం. భారతదేశాన్ని సర్వసత్తాక, సామ్యవాద, లౌకిక, ప్రజాస్వామ్య గణతంత్ర రాజ్యంగా ప్రకటిస్తూ ప్రజలందరికీ న్యాయం, స్వేచ్ఛ, సమానత్వం, సౌభ్రాతృత్వాన్ని ప్రసాదిస్తుంది.',
    caseLaws:
      'Kesavananda Bharati v. State of Kerala (1973) held that the Preamble is an integral part of the Constitution and its basic structure cannot be amended under Article 368.',
    amendments:
      'Amended once by the 42nd Constitutional Amendment Act, 1976, which added the words "SOCIALIST", "SECULAR", and "INTEGRITY".',
  },
  {
    id: 'art-1',
    part: 'PART I',
    partTitle: 'THE UNION AND ITS TERRITORY',
    articleNumber: 'Article 1',
    heading: 'Name and territory of the Union',
    headingTe: 'భారత యూనియన్ పేరు మరియు భూభాగం',
    content:
      '(1) India, that is Bharat, shall be a Union of States.\n(2) The States and the territories thereof shall be as specified in the First Schedule.\n(3) The territory of India shall comprise—\n(a) the territories of the States;\n(b) the Union territories specified in the First Schedule; and\n(c) such other territories as may be acquired.',
    simplifiedNotes:
      'Defines the dual official names "India" and "Bharat", establishing India as an indestructible Union of destructible states with composite federal character.',
    simplifiedNotesTe:
      '"ఇండియా అనగా భారత్" రాష్ట్రాల సమాఖ్య (యూనియన్ ఆఫ్ స్టేట్స్) అని ప్రకటిస్తుంది. కేంద్రం నుండి ఏ రాష్ట్రమూ విడిపోయే హక్కు లేదు.',
    caseLaws: 'State of West Bengal v. Union of India (1963) - Established the supremacy of the Union in territorial sovereignty.',
    amendments: 'Adapted and reorganized via the States Reorganisation Act, 1956 (7th Amendment).',
  },
  {
    id: 'art-14',
    part: 'PART III',
    partTitle: 'FUNDAMENTAL RIGHTS',
    chapter: 'Right to Equality (Articles 14–18)',
    articleNumber: 'Article 14',
    heading: 'Equality before law and equal protection of the laws',
    headingTe: 'చట్టం ముందు సమానత్వం & సమాన రక్షణ',
    content:
      'The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.',
    simplifiedNotes:
      'Prohibits arbitrary discrimination by the State and guarantees that all persons (citizens, foreigners, corporations) are governed equally by law under like circumstances.',
    simplifiedNotesTe:
      'భారతదేశ పరిధిలో ఏ వ్యక్తినీ చట్టం ముందు సమానత్వాన్ని లేదా సమాన రక్షణను ప్రభుత్వం నిరాకరించకూడదు. ప్రభుత్వ నిర్ణయాల్లో ఏకపక్ష వివక్ష చెల్లదు.',
    caseLaws:
      'E.P. Royappa v. State of Tamil Nadu (1974) & Maneka Gandhi (1978): Equality is a dynamic concept antithetic to arbitrariness.',
    amendments: 'Original constitutional text (1950), cornerstone of the Basic Structure Doctrine.',
  },
  {
    id: 'art-15',
    part: 'PART III',
    partTitle: 'FUNDAMENTAL RIGHTS',
    chapter: 'Right to Equality (Articles 14–18)',
    articleNumber: 'Article 15',
    heading: 'Prohibition of discrimination on grounds of religion, race, caste, sex or place of birth',
    headingTe: 'మతం, జాతి, కులం, లింగం లేదా జన్మస్థలం ఆధారంగా వివక్ష నిషేధం',
    content:
      '(1) The State shall not discriminate against any citizen on grounds only of religion, race, caste, sex, place of birth or any of them.\n(2) No citizen shall, on grounds only of religion, race, caste, sex, place of birth or any of them, be subject to any disability, liability, restriction or condition with regard to access to shops, public restaurants, hotels and places of public entertainment...\n(3) Nothing in this article shall prevent the State from making any special provision for women and children.\n(4) Nothing in this article... shall prevent the State from making any special provision for the advancement of any socially and educationally backward classes of citizens or for the Scheduled Castes and the Scheduled Tribes.\n(6) Nothing in this article shall prevent the State from making any special provision for the advancement of any economically weaker sections of citizens...',
    simplifiedNotes:
      'Guarantees citizens protection against discrimination while allowing affirmative action for women, children, SC/STs, OBCs, and economically weaker sections (EWS).',
    simplifiedNotesTe:
      'ప్రజలపై కుల, మత, లింగ వివక్షను నిషేధిస్తుంది. అయితే మహిళలు, పిల్లలు, బలహీన వర్గాలు మరియు ఈడబ్ల్యూఎస్ (EWS) వర్గాలకు ప్రత్యేక రక్షణలు, రిజర్వేషన్లు కల్పించే అధికారాన్ని ప్రభుత్వానికి ఇస్తుంది.',
    caseLaws: 'Janki Prasad Parimoo v. State of J&K (1973) & Janhit Abhiyan v. Union of India (2022) upholding 103rd Amendment.',
    amendments:
      'Clause (4) added by 1st Amendment 1951; Clause (5) by 93rd Amendment 2005; Clause (6) (10% EWS reservation) added by 103rd Constitutional Amendment Act, 2019.',
  },
  {
    id: 'art-19',
    part: 'PART III',
    partTitle: 'FUNDAMENTAL RIGHTS',
    chapter: 'Right to Freedom (Articles 19–22)',
    articleNumber: 'Article 19',
    heading: 'Protection of certain rights regarding freedom of speech, etc.',
    headingTe: 'వాక్ స్వాతంత్ర్యం మరియు ఆరు ప్రాథమిక స్వేచ్ఛల రక్షణ',
    content:
      '(1) All citizens shall have the right—\n(a) to freedom of speech and expression;\n(b) to assemble peaceably and without arms;\n(c) to form associations or unions or co-operative societies;\n(d) to move freely throughout the territory of India;\n(e) to reside and settle in any part of the territory of India; and\n(g) to practise any profession, or to carry on any occupation, trade or business.\n(2) Nothing in sub-clause (a) shall affect the operation of any existing law, or prevent the State from making any law, in so far as such law imposes reasonable restrictions... in the interests of the sovereignty and integrity of India, security of the State, public order, decency or morality.',
    simplifiedNotes:
      'Guarantees 6 fundamental democratic freedoms to citizens, subject to reasonable restrictions under Clause (2) for national integrity, public order, and morality.',
    simplifiedNotesTe:
      'భారత పౌరులందరికీ 6 రకాల స్వేచ్ఛలను (వాక్ స్వాతంత్ర్యం, శాంతియుతంగా సమావేశమయ్యే హక్కు, సంఘాలు, సంచార స్వేచ్ఛ, నివాసం, వ్యాపార హక్కు) కల్పిస్తుంది.',
    caseLaws:
      'Shreya Singhal v. Union of India (2015): Supreme Court struck down Section 66A of the IT Act as violative of Article 19(1)(a).',
    amendments:
      'Sub-clause (f) (Right to Property) deleted by 44th Amendment Act, 1978. "Co-operative societies" added to 19(1)(c) by 97th Amendment Act, 2011.',
  },
  {
    id: 'art-21',
    part: 'PART III',
    partTitle: 'FUNDAMENTAL RIGHTS',
    chapter: 'Right to Freedom (Articles 19–22)',
    articleNumber: 'Article 21',
    heading: 'Protection of life and personal liberty',
    headingTe: 'జీవించే హక్కు మరియు వ్యక్తిగత స్వేచ్ఛ రక్షణ',
    content:
      'No person shall be deprived of his life or personal liberty except according to procedure established by law.',
    simplifiedNotes:
      'The bedrock of human rights in India. Extensively interpreted to guarantee the right to live with human dignity, bodily autonomy, right to privacy, clean environment, free legal aid, and fair trial.',
    simplifiedNotesTe:
      'చట్టం నిర్దేశించిన న్యాయబద్ధమైన పద్ధతిలో తప్ప ఏ వ్యక్తి యొక్క ప్రాణాన్ని లేదా వ్యక్తిగత స్వేచ్ఛను ప్రభుత్వం హరించకూడదు. ఇందులో గౌరవప్రదమైన జీవనం, డిజిటల్ గోప్యత (Privacy), ఉచిత న్యాయ సహాయం ఉన్నాయి.',
    caseLaws:
      'Maneka Gandhi v. Union of India (1978) established that procedure must be "just, fair, and reasonable". Justice K.S. Puttaswamy v. UOI (2017) recognized the Fundamental Right to Privacy.',
    amendments:
      '44th Amendment Act, 1978 ensured Article 21 can NEVER be suspended, even during a National Emergency under Article 359.',
  },
  {
    id: 'art-21a',
    part: 'PART III',
    partTitle: 'FUNDAMENTAL RIGHTS',
    chapter: 'Right to Freedom (Articles 19–22)',
    articleNumber: 'Article 21A',
    heading: 'Right to education',
    headingTe: 'ఉచిత మరియు నిర్బంధ ప్రాథమిక విద్యా హక్కు (6–14 సంవత్సరాలు)',
    content:
      'The State shall provide free and compulsory education to all children of the age of six to fourteen years in such manner as the State may, by law, determine.',
    simplifiedNotes:
      'Makes elementary education an enforceable fundamental right for every child in India between ages 6 and 14, operationalized by the RTE Act, 2009.',
    simplifiedNotesTe:
      '6 నుండి 14 సంవత్సరాల వయస్సు గల పిల్లలందరికీ ఉచిత మరియు నిర్బంధ ప్రాథమిక విద్యను పొందడం ఒక ప్రాథమిక హక్కు.',
    caseLaws: 'Society for Unaided Private Schools of Rajasthan v. Union of India (2012) upheld 25% quota for disadvantaged children under RTE Act.',
    amendments: 'Inserted by the Constitution (Eighty-sixth Amendment) Act, 2002.',
  },
  {
    id: 'art-32',
    part: 'PART III',
    partTitle: 'FUNDAMENTAL RIGHTS',
    chapter: 'Right to Constitutional Remedies (Articles 32–35)',
    articleNumber: 'Article 32',
    heading: 'Remedies for enforcement of rights conferred by this Part',
    headingTe: 'రాజ్యాంగ పరిహారాల హక్కు (సుప్రీం కోర్టు 5 రకాల రిట్లు)',
    content:
      '(1) The right to move the Supreme Court by appropriate proceedings for the enforcement of the rights conferred by this Part is guaranteed.\n(2) The Supreme Court shall have power to issue directions or orders or writs, including writs in the nature of habeas corpus, mandamus, prohibition, quo warranto and certiorari, whichever may be appropriate, for the enforcement of any of the rights conferred by this Part.',
    simplifiedNotes:
      'Gives citizens the direct right to approach the Supreme Court when Fundamental Rights are infringed. Dr. B.R. Ambedkar termed Article 32 the "Heart and Soul of the Constitution".',
    simplifiedNotesTe:
      'ప్రాథమిక హక్కుల ఉల్లంఘన జరిగినప్పుడు పౌరులు నేరుగా సుప్రీం కోర్టును ఆశ్రయించి 5 రకాల రిట్లు (హెబియస్ కార్పస్, మాండమస్, ప్రొహిబిషన్, సెర్షియోరరి, కో-వారంటో) పొందే అత్యున్నత హక్కు.',
    caseLaws:
      'Fertilizer Corporation Kamgar Union v. Union of India (1981): Article 32 is itself a Fundamental Right and cannot be diluted.',
    amendments: 'Preserved as an immutable feature of the Basic Structure of the Indian Constitution.',
  },
  {
    id: 'art-39a',
    part: 'PART IV',
    partTitle: 'DIRECTIVE PRINCIPLES OF STATE POLICY',
    articleNumber: 'Article 39A',
    heading: 'Equal justice and free legal aid',
    headingTe: 'సమాన న్యాయం మరియు పేదలకు ఉచిత న్యాయ సహాయం',
    content:
      'The State shall secure that the operation of the legal system promotes justice, on a basis of equal opportunity, and shall, in particular, provide free legal aid, by suitable legislation or schemes or in any other way, to ensure that opportunities for securing justice are not denied to any citizen by reason of economic or other disabilities.',
    simplifiedNotes:
      'Directs the State to provide free legal representation so no citizen is denied justice due to poverty. Led to the enactment of the Legal Services Authorities Act, 1987 (NALSA & Dial 15100).',
    simplifiedNotesTe:
      'ఆర్థిక ఇబ్బందుల వల్ల ఏ ఒక్కరూ న్యాయానికి దూరం కాకూడదని, పేదలకు ఉచిత న్యాయవాదిని, సేవలను ప్రభుత్వం అందించాలని ఆదేశిస్తుంది (NALSA వ్యవస్థ).',
    caseLaws: 'Hussainara Khatoon v. Home Secretary, State of Bihar (1979): Right to free legal aid is an essential part of fair trial under Art 21.',
    amendments: 'Inserted by the Constitution (Forty-second Amendment) Act, 1976.',
  },
  {
    id: 'art-44',
    part: 'PART IV',
    partTitle: 'DIRECTIVE PRINCIPLES OF STATE POLICY',
    articleNumber: 'Article 44',
    heading: 'Uniform civil code for the citizens',
    headingTe: 'పౌరులందరికీ ఉమ్మడి పౌరస్మృతి (యూనిఫాం సివిల్ కోడ్ - UCC)',
    content:
      'The State shall endeavour to secure for the citizens a Uniform Civil Code throughout the territory of India.',
    simplifiedNotes:
      'Constitutional aspiration to formulate common personal civil laws regarding marriage, divorce, inheritance, and adoption for all citizens regardless of religious community.',
    simplifiedNotesTe:
      'భారతదేశమంతటా మతాలకు అతీతంగా వివాహం, విడాకులు, వారసత్వ ఆస్తి హక్కులపై ఉమ్మడి పౌరస్మృతి (UCC) ని అమలు చేయడానికి ప్రభుత్వం కృషి చేయాలి.',
    caseLaws:
      'Mohd. Ahmed Khan v. Shah Bano Begum (1985) & Sarla Mudgal v. Union of India (1995): Supreme Court urged progressive implementation of Article 44.',
    amendments: 'Drafted in Part IV (DPSP) as a non-justiciable directive to the legislature.',
  },
  {
    id: 'art-51a',
    part: 'PART IVA',
    partTitle: 'FUNDAMENTAL DUTIES',
    articleNumber: 'Article 51A',
    heading: 'Fundamental duties of every citizen of India',
    headingTe: 'భారత పౌరుల ప్రాథమిక విధులు (11 విధులు)',
    content:
      'It shall be the duty of every citizen of India—\n(a) to abide by the Constitution and respect its ideals and institutions, the National Flag and the National Anthem;\n(b) to cherish and follow the noble ideals which inspired our national struggle for freedom;\n(c) to uphold and protect the sovereignty, unity and integrity of India;\n(d) to defend the country and render national service when called upon to do so;\n(e) to promote harmony and the spirit of common brotherhood amongst all the people of India... to renounce practices derogatory to the dignity of women;\n(f) to value and preserve the rich heritage of our composite culture;\n(g) to protect and improve the natural environment including forests, lakes, rivers and wild life...;\n(h) to develop the scientific temper, humanism and the spirit of inquiry and reform;\n(i) to safeguard public property and to abjure violence;\n(j) to strive towards excellence in all spheres of individual and collective activity...;\n(k) who is a parent or guardian to provide opportunities for education to his child or, as the case may be, ward between the age of six and fourteen years.',
    simplifiedNotes:
      'Codifies 11 civic and moral responsibilities of Indian citizens, highlighting scientific temper, respect for national symbols, protection of women, and environmental preservation.',
    simplifiedNotesTe:
      'జాతీయ జెండా, గీతాన్ని గౌరవించడం, పర్యావరణాన్ని కాపాడటం, మహిళల గౌరవాన్ని నిలపడం, శాస్త్రీయ దృక్పథాన్ని (Scientific Temper) పెంపొందించడం ప్రతి పౌరుని ప్రాథమిక విధి.',
    caseLaws: 'AIIMS Students’ Union v. AIIMS (2002): Fundamental duties are equally important and cannot be overlooked.',
    amendments:
      'Added by 42nd Amendment Act, 1976 on the recommendations of the Swaran Singh Committee. 11th duty (k) was added by the 86th Amendment Act, 2002.',
  },
  {
    id: 'art-226',
    part: 'PART VI',
    partTitle: 'THE STATES',
    chapter: 'The High Courts in the States',
    articleNumber: 'Article 226',
    heading: 'Power of High Courts to issue certain writs',
    headingTe: 'హైకోర్టుల రిట్ అధికార పరిధి (ఆర్టికల్ 32 కంటే విస్తృతమైనది)',
    content:
      '(1) Notwithstanding anything in Article 32, every High Court shall have power, throughout the territories in relation to which it exercises jurisdiction, to issue to any person or authority, including in appropriate cases, any Government, within those territories directions, orders or writs, including writs in the nature of habeas corpus, mandamus, prohibition, quo warranto and certiorari, or any of them, for the enforcement of any of the rights conferred by Part III and for any other purpose.',
    simplifiedNotes:
      'Empowers High Courts to issue writs not only for Fundamental Rights but also "for any other purpose" (ordinary legal/statutory rights), giving it wider judicial scope than Article 32.',
    simplifiedNotesTe:
      'రాష్ట్ర హైకోర్టులు ప్రాథమిక హక్కులకే కాకుండా ఇతర చట్టబద్ధమైన హక్కుల రక్షణ కోసం కూడా రిట్లు (Habeas Corpus, Mandamus మొదలైనవి) జారీ చేయగలవు.',
    caseLaws: 'L. Chandra Kumar v. Union of India (1997): Judicial review under Article 226 is an integral, inviolable part of the Basic Structure.',
    amendments: '42nd Amendment 1976 restricted Article 226; 44th Amendment 1978 fully restored its original expansive scope.',
  },
  {
    id: 'art-300a',
    part: 'PART XII',
    partTitle: 'FINANCE, PROPERTY, CONTRACTS AND SUITS',
    chapter: 'Chapter IV: Right to Property',
    articleNumber: 'Article 300A',
    heading: 'Persons not to be deprived of property save by authority of law',
    headingTe: 'చట్టబద్ధమైన అధికారం లేకుండా ఏ వ్యక్తినీ ఆస్తి నుండి దూరం చేయరాదు',
    content:
      'No person shall be deprived of his property save by authority of law.',
    simplifiedNotes:
      'Property is a Constitutional Legal Right and a Human Right in India. The government cannot arbitrarily confiscate citizen property without valid legislative enactment and fair procedure.',
    simplifiedNotesTe:
      'చట్టబద్ధమైన పరిహారం మరియు సరైన విధానం లేకుండా ప్రభుత్వం కూడా పౌరుల ప్రైవేట్ భూమిని లేదా ఆస్తిని ఏకపక్షంగా లాక్కోలేదు. ఇది రాజ్యాంగబద్ధమైన హక్కు.',
    caseLaws: 'Kedar Nath Yadav v. State of West Bengal (2016) & Vidya Devi v. State of Himachal Pradesh (2020) confirming right to property as a human right.',
    amendments:
      'Inserted by the Constitution (Forty-fourth Amendment) Act, 1978, transferring Right to Property from Fundamental Rights (former Art 19(1)(f) and Art 31) into Part XII.',
  },
  {
    id: 'art-368',
    part: 'PART XX',
    partTitle: 'AMENDMENT OF THE CONSTITUTION',
    articleNumber: 'Article 368',
    heading: 'Power of Parliament to amend the Constitution and procedure therefor',
    headingTe: 'రాజ్యాంగాన్ని సవరించే పార్లమెంటు అధికారం మరియు ప్రక్రియ',
    content:
      '(1) Notwithstanding anything in this Constitution, Parliament may in exercise of its constituent power amend by way of addition, variation or repeal any provision of this Constitution in accordance with the procedure laid down in this article...\n(2) An amendment of this Constitution may be initiated only by the introduction of a Bill for the purpose in either House of Parliament...',
    simplifiedNotes:
      'Sets out the procedure for amending the Constitution by Special Majority and State ratification. Governed by the Basic Structure Doctrine: Parliament cannot destroy the essential framework of the Constitution.',
    simplifiedNotesTe:
      'రాజ్యాంగాన్ని సవరించే అధికారం పార్లమెంటుకు ఉంది. అయితే కేశవానంద భారతి తీర్పు ప్రకారం రాజ్యాంగపు "ప్రాథమిక స్వరూపాన్ని" (Basic Structure) మార్చే అధికారం పార్లమెంటుకు లేదు.',
    caseLaws:
      'Kesavananda Bharati v. State of Kerala (1973) & Minerva Mills v. Union of India (1980): The power to amend is not the power to destroy.',
    amendments: '24th Amendment Act, 1971; clauses (4) and (5) added by 42nd Amendment were struck down in Minerva Mills.',
  },
  {
    id: 'amendment-106',
    part: 'LANDMARK AMENDMENT',
    partTitle: '106TH CONSTITUTIONAL AMENDMENT ACT, 2023',
    articleNumber: 'Nari Shakti Vandan Adhiniyam',
    heading: '33% Reservation for Women in Lok Sabha and State Legislative Assemblies',
    headingTe: 'నారీ శక్తి వందన్ అధినియమం (మహిళలకు 33% చట్టసభల రిజర్వేషన్)',
    content:
      'The Constitution (One Hundred and Sixth Amendment) Act, 2023 inserts Articles 330A, 332A, and 239AA(2)(ba), mandating that one-third of the total seats shall be reserved for women in the House of the People (Lok Sabha), State Legislative Assemblies, and the Legislative Assembly of the National Capital Territory of Delhi.',
    simplifiedNotes:
      'Historical gender equity reform providing 33% statutory political representation for women in Parliament and state legislatures for a 15-year period following delimitation.',
    simplifiedNotesTe:
      'లోక్‌సభ మరియు రాష్ట్ర శాసనసభలలో మహిళలకు 33% సీట్లు కేటాయించే చారిత్రక రాజ్యాంగ సవరణ చట్టం (2023).',
    caseLaws: 'Delimitation and Census exercise linked to implementation timeline.',
    amendments: 'Enacted as the 106th Constitutional Amendment Act in September 2023.',
  },
];

// Presets for 1-Tap Solution Diagnosis
interface PresetScenario {
  id: string;
  badge: string;
  titleEn: string;
  titleTe: string;
  query: string;
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'upi-fraud',
    badge: 'Cyber / Banking',
    titleEn: 'UPI / Online Banking Scam',
    titleTe: 'ఆన్‌లైన్ బ్యాంకింగ్ / UPI మోసం',
    query: 'Someone sent a fake QR code and scammed ₹25,000 from my bank account. How to freeze and recover my money?',
  },
  {
    id: 'cyber-deepfake',
    badge: 'Privacy / Women',
    titleEn: 'Photo Morphing / Deepfakes',
    titleTe: 'ఫోటోల మార్ఫింగ్ & వేధింపులు',
    query: 'A fake account is morphing my photos and blackmailing me on Instagram. What legal sections and remedies apply?',
  },
  {
    id: 'zero-fir-denial',
    badge: 'Police / Rights',
    titleEn: 'Police Refused to File FIR',
    titleTe: 'పోలీసులు FIR నమోదు చేయకపోతే?',
    query: 'The local police station told me they have no jurisdiction and refused to register an FIR. Is this legal under BNSS?',
  },
  {
    id: 'consumer-defective',
    badge: 'Consumer',
    titleEn: 'Defective Product / Warranty Refused',
    titleTe: 'లోపభూయిష్ట వస్తువు / వారంటీ నిరాకరణ',
    query: 'I bought an electronic device online that stopped working within 10 days, and the company is refusing replacement or refund.',
  },
  {
    id: 'landlord-deposit',
    badge: 'Civil / Tenancy',
    titleEn: 'Landlord Refused Deposit Refund',
    titleTe: 'ఇంటి ఓనర్ డిపాజిట్ ఇవ్వకపోతే?',
    query: 'I vacated my rented flat with 1 month notice in good condition, but the owner refuses to return my ₹50,000 deposit.',
  },
  {
    id: 'illegal-detention',
    badge: 'Constitution',
    titleEn: 'Illegal Police Detention / Writs',
    titleTe: 'అక్రమ అరెస్ట్ / హెబియస్ కార్పస్',
    query: 'My relative was taken by police 3 days ago without an arrest memo and has not been produced before a Magistrate within 24 hours.',
  },
];

export function LawsConstitutionTool({ onBack }: { onBack?: () => void }) {
  // Navigation & State
  const [activeTab, setActiveTab] = useState<TabType>('codex_book');
  const [langMode, setLangMode] = useState<LanguageMode>('bilingual');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePartFilter, setActivePartFilter] = useState<string>('all');
  
  // Codex View Mode: Book vs UI JSON
  const [codexViewMode, setCodexViewMode] = useState<'book' | 'json'>('book');
  const [selectedCodexItem, setSelectedCodexItem] = useState<ConstitutionCodexItem>(CONSTITUTION_CODEX[0]);

  // Solver State
  const [userQuery, setUserQuery] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [solutionResult, setSolutionResult] = useState<{
    law: string;
    meaning: string;
    provisions: string[];
    remedies: string[];
    bookSimulationText?: string;
    jsonData?: any;
  } | null>(null);
  const [solutionFormatView, setSolutionFormatView] = useState<'card' | 'book' | 'json'>('book');

  // Copy Feedback State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Complaint Generator State
  const [complaintForm, setComplaintForm] = useState({
    complainantName: '',
    phone: '',
    address: '',
    incidentDate: new Date().toISOString().split('T')[0],
    incidentType: 'cyber_upi',
    stationName: 'Cyber Crime Police Station / Local Police Station',
    opponentName: 'Unknown Perpetrator / Scammer',
    narrativeDetails: '',
    amountLost: '',
  });
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2500);
      },
      () => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2500);
      }
    );
  };

  // Text to Speech
  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langMode === 'telugu' ? 'te-IN' : 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Filtered Codex List
  const filteredCodex = useMemo(() => {
    return CONSTITUTION_CODEX.filter((item) => {
      const matchesPart =
        activePartFilter === 'all' || item.part.toLowerCase().includes(activePartFilter.toLowerCase());
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesPart;
      const matchesQuery =
        item.articleNumber.toLowerCase().includes(q) ||
        item.heading.toLowerCase().includes(q) ||
        item.headingTe.toLowerCase().includes(q) ||
        item.part.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.simplifiedNotes.toLowerCase().includes(q) ||
        (item.caseLaws && item.caseLaws.toLowerCase().includes(q));
      return matchesPart && matchesQuery;
    });
  }, [searchQuery, activePartFilter]);

  // Solver Engine: Produces exact Real Book simulation format + JSON format
  const handleSolveQuery = async (queryText?: string) => {
    const q = (queryText || userQuery).trim();
    if (!q) return;

    setIsSolving(true);
    setSolutionResult(null);

    const lower = q.toLowerCase();
    let codexMatch: ConstitutionCodexItem | null = null;

    if (lower.includes('21a') || lower.includes('education') || lower.includes('విద్యా')) {
      codexMatch = CONSTITUTION_CODEX.find((c) => c.id === 'art-21a') || null;
    } else if (lower.includes('privacy') || lower.includes('life') || lower.includes('21') || lower.includes('జీవించే')) {
      codexMatch = CONSTITUTION_CODEX.find((c) => c.id === 'art-21') || null;
    } else if (lower.includes('equality') || lower.includes('14') || lower.includes('సమానత్వం')) {
      codexMatch = CONSTITUTION_CODEX.find((c) => c.id === 'art-14') || null;
    } else if (lower.includes('writ') || lower.includes('habeas') || lower.includes('32') || lower.includes('226') || lower.includes('రిట్')) {
      codexMatch = CONSTITUTION_CODEX.find((c) => c.id === 'art-32') || null;
    } else if (lower.includes('speech') || lower.includes('freedom') || lower.includes('19') || lower.includes('స్వేచ్ఛ')) {
      codexMatch = CONSTITUTION_CODEX.find((c) => c.id === 'art-19') || null;
    } else if (lower.includes('women') || lower.includes('reservation') || lower.includes('106') || lower.includes('నారీ శక్తి')) {
      codexMatch = CONSTITUTION_CODEX.find((c) => c.id === 'amendment-106') || null;
    } else if (lower.includes('ucc') || lower.includes('civil code') || lower.includes('44') || lower.includes('ఉమ్మడి')) {
      codexMatch = CONSTITUTION_CODEX.find((c) => c.id === 'art-44') || null;
    } else if (lower.includes('duties') || lower.includes('duty') || lower.includes('51a') || lower.includes('విధులు')) {
      codexMatch = CONSTITUTION_CODEX.find((c) => c.id === 'art-51a') || null;
    } else if (lower.includes('preamble') || lower.includes('పీఠిక')) {
      codexMatch = CONSTITUTION_CODEX.find((c) => c.id === 'preamble') || null;
    }

    if (codexMatch) {
      const bookSimulation = `📖 **[${codexMatch.part}: ${codexMatch.partTitle}]**
🏛️ **${codexMatch.articleNumber}: ${codexMatch.heading}**
---
**Exact Legal Text / Provision:**
> "${codexMatch.content}"

**Simplified Explanation:**
- Key Takeaway: ${codexMatch.simplifiedNotes} (తెలుగు: ${codexMatch.simplifiedNotesTe})
- Landmark Case Laws / Exceptions: ${codexMatch.caseLaws || 'Governed by Supreme Court jurisprudence.'}
- Historical Context / Amendments: ${codexMatch.amendments || 'Constitution of India (as updated up to 2026).'}
---`;

      const jsonData = {
        part: codexMatch.part,
        partTitle: codexMatch.partTitle,
        articleNumber: codexMatch.articleNumber,
        heading: codexMatch.heading,
        content: codexMatch.content,
        simplifiedNotes: codexMatch.simplifiedNotes,
        amendments: codexMatch.amendments || codexMatch.caseLaws || 'Constitution of India',
      };

      setSolutionResult({
        law: `${codexMatch.articleNumber} (${codexMatch.part}) - ${codexMatch.heading}`,
        meaning: langMode === 'telugu' ? codexMatch.simplifiedNotesTe : codexMatch.simplifiedNotes,
        provisions: [
          `Exact Provision: "${codexMatch.content.slice(0, 160)}..."`,
          `Historical Amendment: ${codexMatch.amendments || 'Integral to Basic Structure'}`,
        ],
        remedies: [
          'Enforceable via Writ Petitions before High Court (Art. 226) or Supreme Court (Art. 32)',
          'Approach Legal Services Authority (NALSA Dial 15100) for free representation',
        ],
        bookSimulationText: bookSimulation,
        jsonData: jsonData,
      });
      setIsSolving(false);
      return;
    }

    // Connect to AI with Real Book Simulation system instructions
    try {
      const response = await api.sendChat({
        messages: [{ role: 'user', parts: [{ text: q }] }],
        systemInstruction: `You are the "Indian Constitution & Law Codex Assistant" embedded inside the Laws section of the GK EDIT application. 
You act as a digital interactive law book containing authentic text and interpretations of The Constitution of India (incorporating all updates up to 2026), BNS 2023, and core statutory laws.
Format your primary response exactly using this Real Book Simulation format:

📖 **[PART NUMBER: TITLE]**
🏛️ **Article / Section [Number]: [Official Title]**
---
**Exact Legal Text / Provision:**
> "[Quoted constitutional or legal text here, preserving numbered clauses (1), (2), (a), (b)]"

**Simplified Explanation:**
- Key Takeaway: [1-2 sentences on what this right/power means for a citizen or authority in English and Telugu]
- Landmark Case Laws / Exceptions (if applicable): [Key Supreme Court decisions]
- Historical Context / Amendments: [e.g., Added by 86th Amendment Act, 2002 / 106th Amendment 2023]
---

Also provide the structured breakdown:
1. Applicable Law / Section
2. Simple Meaning (సాధారణ వివరణ)
3. Key Provisions / Punishments
4. Actionable Steps / Remedies (National Cyber 1930, Zero FIR BNSS 173, Writs).`,
      });

      const fullText = response.text || '';
      const fallbackJson = {
        part: 'CONSTITUTION OF INDIA / STATUTE',
        partTitle: 'LEGAL CODEX ANALYSIS',
        articleNumber: 'Applicable Article / Section',
        heading: q.slice(0, 50),
        content: fullText.slice(0, 250),
        simplifiedNotes: 'Analyzed under the Laws of India (incorporating updates up to 2026).',
        amendments: 'Bharatiya Nyaya Sanhita (BNS 2023) & Constitutional Jurisprudence.',
      };

      setSolutionResult({
        law: 'Constitution of India & Statutory Codes (Analysis)',
        meaning: fullText,
        provisions: [
          'Authentic statutory breakdown rendered by Codex Engine',
          'Refer to official Gazette notifications for recent amendments up to 2026',
        ],
        remedies: [
          'Immediate Emergency / FIR reporting: Dial 112 or 1930',
          'Consult an advocate registered with the Bar Council of India',
        ],
        bookSimulationText: fullText,
        jsonData: fallbackJson,
      });
    } catch {
      setSolutionResult({
        law: 'Constitution of India (Articles 14, 21, 226) & Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)',
        meaning:
          langMode === 'telugu'
            ? 'ఈ సమస్యపై చట్టపరమైన పరిష్కారం కోరడానికి రాజ్యాంగబద్ధమైన హక్కులు అందుబాటులో ఉన్నాయి.'
            : 'Every citizen has fundamental protections under Article 21 and administrative remedies under Indian law.',
        provisions: ['Procedure established by law must be just, fair, and reasonable'],
        remedies: ['Lodge Zero FIR under BNSS Section 173 or seek writ relief under Art 226'],
      });
    } finally {
      setIsSolving(false);
    }
  };

  // Generate Complaint Letter Draft
  const handleGenerateLetter = (e: React.FormEvent) => {
    e.preventDefault();
    const isCyber = complaintForm.incidentType === 'cyber_upi';
    const letter = `TO,
THE STATION HOUSE OFFICER (SHO) / OFFICER-IN-CHARGE,
${complaintForm.stationName.toUpperCase()},
INDIA.

DATE: ${complaintForm.incidentDate}

SUBJECT: FORMAL WRITTEN COMPLAINT REGARDING ${
      isCyber ? 'ONLINE FINANCIAL FRAUD & CYBER CRIME' : 'OFFENCE UNDER BHARATIYA NYAYA SANHITA (BNS)'
    } - REQUEST FOR IMMEDIATE REGISTRATION OF ZERO FIR / INVESTIGATION.

Respected Sir / Madam,

I, ${complaintForm.complainantName || '[Complainant Full Name]'}, residing at ${
      complaintForm.address || '[Complainant Residential Address]'
    }, Mobile No: ${complaintForm.phone || '[Mobile Number]'}, bring the following serious grievance to your official notice:

1. INCIDENT DETAILS:
On or around ${complaintForm.incidentDate}, an illegal incident transpired involving ${
      complaintForm.opponentName || 'unknown suspect(s)'
    }.
${
  complaintForm.amountLost
    ? `Financial Loss Sustained: ₹${complaintForm.amountLost} (INR).`
    : ''
}

2. BRIEF STATEMENT OF FACTS:
${complaintForm.narrativeDetails || 'The accused deceived and defrauded the complainant using deceptive digital means, unauthorized transfers, or wrongful threats without lawful authority.'}

3. APPLICABLE PROVISIONS OF LAW:
- Bharatiya Nyaya Sanhita (BNS 2023): Section 318 (Cheating), Section 303 (Theft), Section 351 (Criminal Intimidation).
- Information Technology Act, 2000: Sections 66, 66C (Identity Theft), 66D (Cheating by Personation).
- Bharatiya Nagarik Suraksha Sanhita (BNSS 2023): Section 173 (Mandatory Recording of Cognizable Crime & Zero FIR).

4. PRAYER / RELIEF SOUGHT:
In light of the above facts, I earnestly request your esteemed office to:
a) Register an immediate FIR / Zero FIR in accordance with Section 173 of BNSS.
b) Issue freeze instructions to the concerned Bank / Gateway nodal officers to secure transited funds.
c) Provide me with a free, acknowledged copy of the registered First Information Report.

Enclosures Attached:
1. Bank Account Statement / UPI Transaction Slip / UTR Numbers.
2. Screenshot transcripts of WhatsApp / SMS / Call records.
3. Copy of Government ID Proof (Aadhaar / PAN Card).

Yours Faithfully,

(Signature)
${complaintForm.complainantName || '[Complainant Name]'}
Contact: ${complaintForm.phone || '[Mobile Phone]'}`;

    setGeneratedLetter(letter);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Legal Codex Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] shrink-0">
              <BookMarked className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  INDIAN CONSTITUTION & LAW CODEX
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  రాజ్యాంగ గ్రంథం & న్యాయ సంహిత
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Interactive Law Book with verbatim articles, book simulation, amendments up to 2026 & Telugu translations
              </p>
            </div>
          </div>

          {/* Language Switcher Mode */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-white/10 rounded-xl p-1 shrink-0 self-end sm:self-auto">
            <Languages className="w-3.5 h-3.5 text-amber-400 ml-1.5" />
            <button
              onClick={() => setLangMode('bilingual')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                langMode === 'bilingual'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bilingual
            </button>
            <button
              onClick={() => setLangMode('telugu')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                langMode === 'telugu'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              తెలుగు
            </button>
            <button
              onClick={() => setLangMode('english')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                langMode === 'english'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-start gap-2 text-[11px] text-amber-200/80 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Legal Codex Information (చట్టపరమైన సమాచారం):</strong> Authentic legal book representation of the Constitution of India, BNS, and statutory enactments. Provides constitutional literacy and legal information, not formal attorney-client advice.
          </span>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none py-1 border-b border-white/10">
        <button
          onClick={() => setActiveTab('codex_book')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'codex_book'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>BookView (పుస్తక రీడర్)</span>
        </button>

        <button
          onClick={() => setActiveTab('solver')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'solver'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Scenario Solver & AI (సమస్య పరిష్కారం)</span>
        </button>

        <button
          onClick={() => setActiveTab('bns')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'bns'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Gavel className="w-3.5 h-3.5" />
          <span>BNS 2023 & IPC (న్యాయ సంహిత)</span>
        </button>

        <button
          onClick={() => setActiveTab('cyber_consumer')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'cyber_consumer'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Cyber & Consumer (సైబర్ & హక్కులు)</span>
        </button>

        <button
          onClick={() => setActiveTab('generator')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'generator'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Complaint Generator (ఫిర్యాదు పత్రం)</span>
        </button>

        <button
          onClick={() => setActiveTab('helplines')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'helplines'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Emergency Portals (1930 / 112)</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: BOOKVIEW CONTAINER (PAPER TEXTURE, SERIF TYPOGRAPHY & CHAPTER TABS) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'codex_book' && <BookView />}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: INTERACTIVE SCENARIO SOLVER (4-PART RESPONSE + BOOK FORMAT) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'solver' && (
        <div className="space-y-6">
          {/* Query Box with presets */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                Describe Your Legal Situation or Question (చట్టపరమైన ప్రశ్న)
              </h3>
              <p className="text-xs text-slate-400">
                Type in Telugu, English, or mix (e.g. &quot;Article 21 privacy rights&quot; or &quot;Online UPI fraud ₹25,000&quot; or &quot;పోలీసులు ఎఫ్ఐఆర్ నమోదు చేయకపోతే ఏం చేయాలి?&quot;)
              </p>
            </div>

            <div className="relative">
              <textarea
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Describe what happened: incident details, date, cyber harassment, loss, or article number you wish to look up..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition resize-none"
              />
              <div className="flex items-center justify-between mt-2 pt-1">
                <span className="text-[11px] text-slate-500">
                  Outputs in authentic Law Book format with plain-language takeaways & remedies
                </span>
                <button
                  onClick={() => handleSolveQuery()}
                  disabled={isSolving || !userQuery.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer"
                >
                  {isSolving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Consulting Law Codex...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Analyze Legal Codex</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Scenario Preset Chips */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                ⚡ Frequent Situations (1-Tap Analysis):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {PRESET_SCENARIOS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setUserQuery(preset.query);
                      handleSolveQuery(preset.query);
                    }}
                    className="text-left p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-400/50 hover:bg-amber-500/5 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-amber-400/90 font-bold uppercase">
                        {preset.badge}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">
                      {preset.titleEn}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {preset.titleTe}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Structured Output Card */}
          {solutionResult && (
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    Law Codex Assistant Analysis (చట్ట విశ్లేషణ)
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {solutionResult.law}
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* Format View Toggle */}
                  <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
                    <button
                      onClick={() => setSolutionFormatView('book')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                        solutionFormatView === 'book'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      📖 Book
                    </button>
                    <button
                      onClick={() => setSolutionFormatView('card')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                        solutionFormatView === 'card'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      🗂️ 4-Part
                    </button>
                    <button
                      onClick={() => setSolutionFormatView('json')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                        solutionFormatView === 'json'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      { } JSON
                    </button>
                  </div>

                  <button
                    onClick={() => handleSpeak(solutionResult.meaning)}
                    className="p-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>🔊 Read</span>
                  </button>

                  <button
                    onClick={() => {
                      const textToCopy =
                        solutionFormatView === 'book' && solutionResult.bookSimulationText
                          ? solutionResult.bookSimulationText
                          : solutionFormatView === 'json' && solutionResult.jsonData
                          ? JSON.stringify(solutionResult.jsonData, null, 2)
                          : `1. APPLICABLE LAW:\n${solutionResult.law}\n\n2. SIMPLE MEANING:\n${solutionResult.meaning}\n\n3. PROVISIONS:\n- ${solutionResult.provisions.join('\n- ')}\n\n4. REMEDIES:\n- ${solutionResult.remedies.join('\n- ')}`;
                      handleCopy(textToCopy, 'solution_copy');
                    }}
                    className="p-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
                  >
                    {copiedKey === 'solution_copy' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-950" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* View 1: Real Book Simulation Display */}
              {solutionFormatView === 'book' && (
                <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-5 space-y-4 font-serif">
                  <div className="whitespace-pre-wrap text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                    {solutionResult.bookSimulationText || (
                      <div className="space-y-3 font-serif">
                        <div className="text-amber-400 font-mono font-bold text-xs">
                          📖 [THE CONSTITUTION OF INDIA / STATUTORY LAW]
                        </div>
                        <div className="text-white font-bold text-base">
                          🏛️ {solutionResult.law}
                        </div>
                        <hr className="border-amber-500/20" />
                        <div className="text-amber-300 font-mono text-xs uppercase font-bold">
                          Exact Legal Text / Provision:
                        </div>
                        <blockquote className="border-l-4 border-amber-500 pl-4 py-1 text-slate-200 italic">
                          &ldquo;{solutionResult.meaning}&rdquo;
                        </blockquote>
                        <div className="text-cyan-400 font-mono text-xs uppercase font-bold pt-2">
                          Simplified Explanation:
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-300 font-sans text-xs sm:text-sm">
                          <li>Key Takeaway: Citizens are guaranteed protections against arbitrary infringements.</li>
                          <li>Landmark Jurisprudence: Enforceable under Article 226/32.</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View 2: Structured 4-Part Card Layout */}
              {solutionFormatView === 'card' && (
                <div className="space-y-4">
                  {/* Part 1: Applicable Law */}
                  <div className="rounded-xl bg-slate-950/80 border border-amber-500/30 p-4 space-y-1">
                    <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5" />
                      1. Applicable Law / Article / Section (వర్తించే చట్టం / సెక్షన్)
                    </span>
                    <div className="text-sm sm:text-base font-bold text-white">
                      {solutionResult.law}
                    </div>
                  </div>

                  {/* Part 2: Simple Meaning */}
                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-1.5">
                    <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      2. Simple Meaning (సాధారణ వివరణ)
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                      {solutionResult.meaning}
                    </p>
                  </div>

                  {/* Part 3: Provisions / Punishments */}
                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-1.5">
                    <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      3. Key Provisions / Punishments (ముఖ్య అంశాలు & పరిణామాలు)
                    </span>
                    <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300">
                      {solutionResult.provisions.map((prov, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                          <span>{prov}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Part 4: Actionable Steps / Remedies */}
                  <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-4 space-y-1.5">
                    <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      4. Actionable Steps / Remedies (ఎలాంటి చర్యలు తీసుకోవాలి)
                    </span>
                    <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200">
                      {solutionResult.remedies.map((rem, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span>{rem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* View 3: Clean UI JSON */}
              {solutionFormatView === 'json' && (
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-amber-300 overflow-x-auto">
                  {JSON.stringify(
                    solutionResult.jsonData || {
                      part: 'CONSTITUTION / STATUTE',
                      partTitle: 'LEGAL CODEX',
                      articleNumber: solutionResult.law,
                      heading: 'Diagnostic Legal Analysis',
                      content: solutionResult.meaning,
                      simplifiedNotes: solutionResult.provisions.join(' '),
                      amendments: solutionResult.remedies.join(' '),
                    },
                    null,
                    2
                  )}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: BNS 2023 & CRIMINAL CODES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'bns' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                Bharatiya Nyaya Sanhita (BNS 2023) & BNSS Conversion Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              India&apos;s modernized criminal justice code effective July 1, 2024, replacing the Indian Penal Code 1860, CrPC 1973, and Indian Evidence Act 1872 with updated provisions for cyber fraud, organized crime, zero FIR, and electronic evidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                section: 'Section 318, BNS 2023',
                former: 'Former IPC Section 420',
                title: 'Cheating & Dishonestly Inducing Delivery of Property',
                titleTe: 'మోసం & మోసపూరితంగా ఆస్తి/డబ్బు దోపిడీ',
                punishment: 'Rigorous imprisonment up to 7 years + fine for severe financial scams',
                remedy: 'Lodge FIR and notify bank within 72 hours under RBI guidelines',
              },
              {
                section: 'Section 173, BNSS 2023',
                former: 'Former Section 154 CrPC',
                title: 'Mandatory Zero FIR & E-FIR Rights',
                titleTe: 'జీరో ఎఫ్ఐఆర్ & ఈ-ఎఫ్ఐఆర్ దాఖలు చేసుకునే హక్కు',
                punishment: 'Police officers cannot refuse recording information regarding cognizable offences',
                remedy: 'If refused, escalate to SP / Commissioner under BNSS 173(4) or Judicial Magistrate',
              },
              {
                section: 'Section 303, BNS 2023',
                former: 'Former IPC Section 378/379',
                title: 'Theft & Digital Asset Embezzlement',
                titleTe: 'దొంగతనం & ఆస్తుల అపహరణ',
                punishment: 'Imprisonment up to 3 years, or fine, or community service for petty theft',
                remedy: 'Report immediately via police emergency 112 or local station',
              },
              {
                section: 'Section 78, BNS 2023',
                former: 'Former IPC Section 354D',
                title: 'Online Stalking & Electronic Monitoring of Women',
                titleTe: 'ఆన్‌లైన్ స్టాకింగ్ & మహిళలపై సైబర్ వేధింపులు',
                punishment: 'Up to 3 years imprisonment on first conviction; up to 5 years on second',
                remedy: 'Report on cybercrime.gov.in and dial Women Helpline 1091 / 181',
              },
              {
                section: 'Section 356, BNS 2023',
                former: 'Former IPC Section 499/500',
                title: 'Criminal Defamation (Online & Public)',
                titleTe: 'పరువు నష్టం (ఆన్‌లైన్ & సోషల్ మీడియా నిందారోపణలు)',
                punishment: 'Simple imprisonment up to 2 years, or fine, or community service',
                remedy: 'Serve formal legal notice; file private criminal complaint before Magistrate',
              },
              {
                section: 'Section 111, BNS 2023',
                former: 'New Statutory Provision',
                title: 'Organized Crime, Cyber Syndicates & Syndicate Scams',
                titleTe: 'వ్యవస్థీకృత నేరాలు & సైబర్ మోసాల ముఠాలు',
                punishment: 'Rigorous imprisonment not less than 5 years up to life imprisonment',
                remedy: 'Reported to State Cyber Crime Cells and National Investigation Authorities',
              },
            ].map((bns, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-3 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    {bns.section}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {bns.former}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{bns.title}</h4>
                  <p className="text-xs text-amber-200/70">{bns.titleTe}</p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <strong className="text-rose-400">Punishment:</strong> {bns.punishment}
                  </div>
                  <div>
                    <strong className="text-emerald-400">Actionable Remedy:</strong> {bns.remedy}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: CYBER & CONSUMER PROTECTIONS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'cyber_consumer' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 space-y-3 shadow-lg">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider block">
                CYBERCRIME: IT ACT, 2000 & DPDP 2023
              </span>
              <h4 className="text-base font-bold text-white">
                Online Fraud, Data Privacy & 1930 Helpline
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sections 66C (Identity Theft) and 66D (Cheating by Personation) carry up to 3 years imprisonment and ₹1 Lakh fine. Section 66E penalizes violation of bodily privacy.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  cybercrime.gov.in <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="tel:1930"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-rose-400" /> Dial 1930
                </a>
              </div>
            </div>

            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-3 shadow-lg">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                CONSUMER PROTECTION ACT, 2019
              </span>
              <h4 className="text-base font-bold text-white">
                Defective Goods, Warranty Refusals & e-Daakhil
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Protects consumers against deficient services and misleading ads. File claims up to ₹50 Lakh at District Commissions without an advocate via the online e-Daakhil portal.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <a
                  href="https://consumerhelpline.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  consumerhelpline.gov.in <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="tel:1915"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-amber-400" /> Dial 1915
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: FORMAL GRIEVANCE COMPLAINT GENERATOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'generator' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-amber-400" />
              Police Complaint & Legal Grievance Letter Generator
            </h3>
            <p className="text-xs text-slate-400">
              Generate a legally compliant, formatted complaint letter for the Station House Officer (SHO) or Cyber Crime Cell under BNSS Section 173 and IT Act.
            </p>
          </div>

          <form onSubmit={handleGenerateLetter} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Your Full Name (బాధితుని పేరు) *
              </label>
              <input
                type="text"
                required
                value={complaintForm.complainantName}
                onChange={(e) => setComplaintForm({ ...complaintForm, complainantName: e.target.value })}
                placeholder="e.g. Ramesh Reddy"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Contact Phone Number (ఫోన్ నంబర్) *
              </label>
              <input
                type="tel"
                required
                value={complaintForm.phone}
                onChange={(e) => setComplaintForm({ ...complaintForm, phone: e.target.value })}
                placeholder="e.g. +91 9876543210"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Residential Address (చిరునామా) *
              </label>
              <input
                type="text"
                required
                value={complaintForm.address}
                onChange={(e) => setComplaintForm({ ...complaintForm, address: e.target.value })}
                placeholder="Door No, Street, Landmark, Town/City, Pincode"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Incident Date (సంఘటన జరిగిన తేదీ)
              </label>
              <input
                type="date"
                value={complaintForm.incidentDate}
                onChange={(e) => setComplaintForm({ ...complaintForm, incidentDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Complaint Type (ఫిర్యాదు రకం)
              </label>
              <select
                value={complaintForm.incidentType}
                onChange={(e) => setComplaintForm({ ...complaintForm, incidentType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="cyber_upi">Online Financial Fraud (UPI / Bank scam)</option>
                <option value="cyber_harassment">Cyber Stalking / Photo Morphing / Blackmail</option>
                <option value="consumer_defect">Consumer Product Defect / Refund Denied</option>
                <option value="tenancy_deposit">Withheld Rent Deposit / Illegal Eviction</option>
                <option value="criminal_theft">Theft / Cheating / General Criminal Offence</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Financial Amount Lost (if applicable)
              </label>
              <input
                type="text"
                value={complaintForm.amountLost}
                onChange={(e) => setComplaintForm({ ...complaintForm, amountLost: e.target.value })}
                placeholder="e.g. ₹35,000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Accused / Suspect (if known)
              </label>
              <input
                type="text"
                value={complaintForm.opponentName}
                onChange={(e) => setComplaintForm({ ...complaintForm, opponentName: e.target.value })}
                placeholder="e.g. Unknown Telegram Operator / Specific Person / Company"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Brief Narrative of Incident (సంఘటన పూర్తి వివరాలు) *
              </label>
              <textarea
                required
                rows={3}
                value={complaintForm.narrativeDetails}
                onChange={(e) => setComplaintForm({ ...complaintForm, narrativeDetails: e.target.value })}
                placeholder="Describe how the contact initiated, transfer details, UPI transaction IDs, messages received, or refusal to resolve..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                Generate Legal Grievance Letter
              </button>
            </div>
          </form>

          {/* Generated Letter Preview */}
          {generatedLetter && (
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  📄 Formatted Complaint Letter (Ready to Print & Submit)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const blob = new Blob([generatedLetter], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Police_Complaint_${complaintForm.complainantName || 'Draft'}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="p-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download TXT</span>
                  </button>

                  <button
                    onClick={() => handleCopy(generatedLetter, 'letter')}
                    className="p-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedKey === 'letter' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-950" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Draft</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {generatedLetter}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: EMERGENCY HELPLINES & GOVERNMENT PORTALS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'helplines' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-emerald-400" />
              National Emergency Helplines & Statutory Portals
            </h3>
            <p className="text-xs text-slate-400">
              Direct access to Government of India 24x7 emergency helplines and legal redressal portals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Cybercrime 1930 */}
            <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                  CYBER & FINANCIAL SCAMS
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              </div>
              <div className="text-2xl font-black text-white font-mono">1930</div>
              <p className="text-xs text-slate-300">
                National Cyber Crime Reporting Helpline. Call within 1-2 hours of unauthorized bank transfer to freeze accounts.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="tel:1930"
                  className="flex-1 py-2 text-center rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs transition"
                >
                  Dial 1930
                </a>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
                  title="cybercrime.gov.in"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* National Emergency 112 */}
            <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                  ALL-INDIA EMERGENCY
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              </div>
              <div className="text-2xl font-black text-white font-mono">112</div>
              <p className="text-xs text-slate-300">
                Single emergency response number (ERSS) for Police, Fire, and Ambulance across all States and Union Territories.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="tel:112"
                  className="flex-1 py-2 text-center rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs transition"
                >
                  Dial 112
                </a>
                <a
                  href="https://112.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
                  title="112.gov.in"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Women Helpline 1091 / 181 */}
            <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                  WOMEN IN DISTRESS
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              </div>
              <div className="text-2xl font-black text-white font-mono">1091 / 181</div>
              <p className="text-xs text-slate-300">
                24x7 emergency response, legal counseling, and police intervention for women facing violence or harassment.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="tel:1091"
                  className="flex-1 py-2 text-center rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition"
                >
                  Dial 1091
                </a>
                <a
                  href="tel:181"
                  className="flex-1 py-2 text-center rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition"
                >
                  Dial 181
                </a>
              </div>
            </div>

            {/* Consumer Helpline 1915 */}
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  NATIONAL CONSUMER HELPLINE
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <div className="text-2xl font-black text-white font-mono">1915</div>
              <p className="text-xs text-slate-300">
                Ministry of Consumer Affairs grievance helpline for deficient goods, e-commerce refusal, or refund delays.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="tel:1915"
                  className="flex-1 py-2 text-center rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  Dial 1915
                </a>
                <a
                  href="https://consumerhelpline.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
                  title="consumerhelpline.gov.in"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* NALSA Free Legal Aid 15100 */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  FREE LEGAL AID (NALSA)
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="text-2xl font-black text-white font-mono">15100</div>
              <p className="text-xs text-slate-300">
                National Legal Services Authority (Article 39A) provides free government advocates for marginalized citizens and women.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="tel:15100"
                  className="flex-1 py-2 text-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Dial 15100
                </a>
                <a
                  href="https://nalsa.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
                  title="nalsa.gov.in"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* eCourts Services */}
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  JUDICIAL CASE TRACKING
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              </div>
              <div className="text-base font-bold text-white font-mono mt-1">eCourts Portal</div>
              <p className="text-xs text-slate-300">
                Lookup case status, cause lists, orders, and certified judgements for all High Courts and District Courts in India.
              </p>
              <div className="pt-1">
                <a
                  href="https://ecourts.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 text-center rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  Open eCourts.gov.in <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
