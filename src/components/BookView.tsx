import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Scale,
  Gavel,
  ChevronLeft,
  ChevronRight,
  Search,
  Copy,
  Check,
  Code2,
  Volume2,
  Languages,
  Bookmark,
  Sparkles,
  Maximize2,
  Minimize2,
  Share2,
  FileText,
  ShieldCheck,
  ScrollText,
} from 'lucide-react';

export type BookTheme = 'parchment' | 'ivory' | 'midnight';
export type BookSection = 'constitution' | 'ipc_bns';

export interface BookEntry {
  id: string;
  source: 'constitution' | 'ipc_bns';
  chapterId: string;
  chapterTitleEn: string;
  chapterTitleTe: string;
  sectionNumber: string; // e.g. "Article 21" or "Section 318 (BNS) / Sec 420 (IPC)"
  formerCode?: string;
  titleEn: string;
  titleTe: string;
  verbatimText: string;
  simplifiedMeaningEn: string;
  simplifiedMeaningTe: string;
  caseLawsOrPunishmentEn: string;
  caseLawsOrPunishmentTe: string;
  amendmentOrProcedureEn: string;
  amendmentOrProcedureTe: string;
}

// --------------------------------------------------------------------------
// COMPREHENSIVE REPOSITORY FOR BOTH CONSTITUTION AND IPC / BNS
// --------------------------------------------------------------------------
export const BOOK_ENTRIES: BookEntry[] = [
  // --- CONSTITUTION: PREAMBLE ---
  {
    id: 'const-preamble',
    source: 'constitution',
    chapterId: 'preamble',
    chapterTitleEn: 'The Preamble',
    chapterTitleTe: 'భారత రాజ్యాంగ పీఠిక (ప్రవేశిక)',
    sectionNumber: 'The Preamble',
    titleEn: 'Preamble to the Constitution of India',
    titleTe: 'భారత రాజ్యాంగ పీఠిక',
    verbatimText:
      'WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC and to secure to all its citizens:\n\nJUSTICE, social, economic and political;\nLIBERTY of thought, expression, belief, faith and worship;\nEQUALITY of status and of opportunity;\nand to promote among them all\nFRATERNITY assuring the dignity of the individual and the unity and integrity of the Nation;\n\nIN OUR CONSTITUENT ASSEMBLY this twenty-sixth day of November, 1949, do HEREBY ADOPT, ENACT AND GIVE TO OURSELVES THIS CONSTITUTION.',
    simplifiedMeaningEn:
      'The Preamble serves as the soul and ideological foundation of the Constitution, proclaiming India as a sovereign socialist secular democratic republic guaranteeing justice, liberty, equality, and fraternity.',
    simplifiedMeaningTe:
      'పీఠిక భారత రాజ్యాంగానికి దిక్సూచి. భారతదేశాన్ని సర్వసత్తాక, సామ్యవాద, లౌకిక, ప్రజాస్వామ్య గణతంత్ర రాజ్యంగా ప్రకటిస్తూ ప్రజలందరికీ న్యాయం, స్వేచ్ఛ, సమానత్వం, సౌభ్రాతృత్వాన్ని ప్రసాదిస్తుంది.',
    caseLawsOrPunishmentEn:
      'Kesavananda Bharati v. State of Kerala (1973) held that the Preamble is an integral part of the Constitution and forms the inviolable Basic Structure.',
    caseLawsOrPunishmentTe:
      'కేశవానంద భారతి తీర్పు (1973): పీఠిక రాజ్యాంగంలో అంతర్భాగం మరియు దాని ప్రాథమిక స్వరూపాన్ని మార్చలేరు.',
    amendmentOrProcedureEn:
      'Amended once by the 42nd Constitutional Amendment Act, 1976 (added "SOCIALIST", "SECULAR", and "INTEGRITY").',
    amendmentOrProcedureTe:
      '42వ రాజ్యాంగ సవరణ చట్టం (1976) ద్వారా "సామ్యవాద", "లౌకిక", "సమగ్రత" అనే పదాలు చేర్చబడ్డాయి.',
  },

  // --- CONSTITUTION: PART I ---
  {
    id: 'const-art-1',
    source: 'constitution',
    chapterId: 'part-1',
    chapterTitleEn: 'Part I: The Union & Its Territory',
    chapterTitleTe: 'భాగం 1: యూనియన్ మరియు దాని భూభాగం',
    sectionNumber: 'Article 1',
    titleEn: 'Name and territory of the Union',
    titleTe: 'భారత యూనియన్ పేరు మరియు భూభాగం',
    verbatimText:
      '(1) India, that is Bharat, shall be a Union of States.\n\n(2) The States and the territories thereof shall be as specified in the First Schedule.\n\n(3) The territory of India shall comprise—\n(a) the territories of the States;\n(b) the Union territories specified in the First Schedule; and\n(c) such other territories as may be acquired.',
    simplifiedMeaningEn:
      'Enshrines the dual official nomenclature "India, that is Bharat" and establishes India as an indestructible Union of states without any right of secession.',
    simplifiedMeaningTe:
      '"ఇండియా అనగా భారత్" రాష్ట్రాల సమాఖ్య అని ప్రకటిస్తుంది. దేశ సమగ్రత దృష్ట్యా ఏ రాష్ట్రానికీ దేశం నుండి విడిపోయే హక్కు లేదు.',
    caseLawsOrPunishmentEn:
      'State of West Bengal v. Union of India (1963): Sovereignty is distributed between the Union and the States with paramountcy of the Union.',
    caseLawsOrPunishmentTe:
      'పశ్చిమ బెంగాల్ వర్సెస్ యూనియన్ ఆఫ్ ఇండియా (1963): యూనియన్ సార్వభౌమాధికారం సర్వోన్నతమైనది.',
    amendmentOrProcedureEn:
      'Territories reorganized and updated under States Reorganisation Acts and Amendments.',
    amendmentOrProcedureTe:
      'రాష్ట్రాల పునర్వ్యవస్థీకరణ చట్టాలు మరియు 7వ రాజ్యాంగ సవరణ (1956) ద్వారా విస్తరించబడింది.',
  },

  // --- CONSTITUTION: PART III FUNDAMENTAL RIGHTS ---
  {
    id: 'const-art-14',
    source: 'constitution',
    chapterId: 'part-3',
    chapterTitleEn: 'Part III: Fundamental Rights',
    chapterTitleTe: 'భాగం 3: ప్రాథమిక హక్కులు',
    sectionNumber: 'Article 14',
    titleEn: 'Equality before law and equal protection of the laws',
    titleTe: 'చట్టం ముందు సమానత్వం & సమాన రక్షణ',
    verbatimText:
      'The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.',
    simplifiedMeaningEn:
      'Guarantees all persons (citizens, foreigners, corporations) equality before the law and strikes down arbitrary, unfair state actions.',
    simplifiedMeaningTe:
      'భారత భూభాగంలో ఏ వ్యక్తినీ చట్టం ముందు సమానత్వాన్ని లేదా సమాన రక్షణను ప్రభుత్వం నిరాకరించకూడదు. ప్రభుత్వ ఏకపక్ష నిర్ణయాలు చెల్లవు.',
    caseLawsOrPunishmentEn:
      'E.P. Royappa v. State of Tamil Nadu (1974) & Maneka Gandhi (1978): Equality is a dynamic concept antithetic to arbitrariness.',
    caseLawsOrPunishmentTe:
      'ఈపీ రోయప్ప కేసు (1974): సమానత్వం అంటే ఏకపక్ష ధోరణిని వ్యతిరేకించడం.',
    amendmentOrProcedureEn:
      'Core inviolable pillar of the Basic Structure Doctrine; enforceable directly via Article 32 & 226.',
    amendmentOrProcedureTe:
      'రాజ్యాంగ ప్రాథమిక స్వరూపంలో భాగం. సుప్రీం కోర్టు ఆర్టికల్ 32 ద్వారా నేరుగా అమలు చేయవచ్చు.',
  },
  {
    id: 'const-art-19',
    source: 'constitution',
    chapterId: 'part-3',
    chapterTitleEn: 'Part III: Fundamental Rights',
    chapterTitleTe: 'భాగం 3: ప్రాథమిక హక్కులు',
    sectionNumber: 'Article 19',
    titleEn: 'Protection of six fundamental freedoms',
    titleTe: 'ఆరు ప్రాథమిక స్వేచ్ఛల పరిరక్షణ',
    verbatimText:
      '(1) All citizens shall have the right—\n(a) to freedom of speech and expression;\n(b) to assemble peaceably and without arms;\n(c) to form associations or unions or co-operative societies;\n(d) to move freely throughout the territory of India;\n(e) to reside and settle in any part of the territory of India; and\n(g) to practise any profession, or to carry on any occupation, trade or business.\n\n(2) Nothing in sub-clause (a) shall prevent the State from making any law imposing reasonable restrictions in the interests of sovereignty, integrity, security of the State, friendly relations with foreign States, public order, decency or morality.',
    simplifiedMeaningEn:
      'Empowers citizens with 6 fundamental democratic freedoms (speech, peaceful assembly, association, travel, residence, and trade) subject to reasonable restrictions.',
    simplifiedMeaningTe:
      'వాక్ స్వాతంత్ర్యం, శాంతియుత సమావేశాలు, సంఘాల ఏర్పాటు, దేశమంతటా సంచారం, నివాసం, వ్యాపార హక్కులను పౌరులకు ప్రసాదిస్తుంది.',
    caseLawsOrPunishmentEn:
      'Shreya Singhal v. Union of India (2015) struck down Section 66A of the IT Act for violating Article 19(1)(a).',
    caseLawsOrPunishmentTe:
      'శ్రేయ సింఘాల్ కేసు (2015): వాక్ స్వాతంత్ర్యానికి విఘాతం కలిగించే ఐటీ చట్టం 66A సెక్షన్ రద్దు చేయబడింది.',
    amendmentOrProcedureEn:
      'Right to Property (19(1)(f)) deleted by 44th Amendment 1978; Co-operatives added by 97th Amendment 2011.',
    amendmentOrProcedureTe:
      '44వ సవరణ (1978) ద్వారా ఆస్తి హక్కు తొలగించబడింది; 97వ సవరణ (2011) ద్వారా సహకార సంఘాలు చేర్చబడ్డాయి.',
  },
  {
    id: 'const-art-21',
    source: 'constitution',
    chapterId: 'part-3',
    chapterTitleEn: 'Part III: Fundamental Rights',
    chapterTitleTe: 'భాగం 3: ప్రాథమిక హక్కులు',
    sectionNumber: 'Article 21',
    titleEn: 'Protection of life and personal liberty',
    titleTe: 'జీవించే హక్కు మరియు వ్యక్తిగత స్వేచ్ఛ రక్షణ',
    verbatimText:
      'No person shall be deprived of his life or personal liberty except according to procedure established by law.',
    simplifiedMeaningEn:
      'The foundational core of Indian human rights: broad interpretation covers the right to live with human dignity, privacy, clean environment, fair trial, and bodily integrity.',
    simplifiedMeaningTe:
      'చట్టం నిర్దేశించిన న్యాయబద్ధమైన పద్ధతిలో తప్ప ఏ వ్యక్తి యొక్క ప్రాణాన్ని లేదా వ్యక్తిగత స్వేచ్ఛను ప్రభుత్వం హరించకూడదు. ఇందులో గోప్యత (Privacy) మరియు గౌరవప్రదమైన జీవనం ఉన్నాయి.',
    caseLawsOrPunishmentEn:
      'Maneka Gandhi (1978) established "just, fair, and reasonable" procedure; K.S. Puttaswamy (2017) recognized the Fundamental Right to Privacy.',
    caseLawsOrPunishmentTe:
      'పుట్టస్వామి తీర్పు (2017): డిజిటల్ & వ్యక్తిగత గోప్యతా హక్కు ఆర్టికల్ 21 కింద ప్రాథమిక హక్కు.',
    amendmentOrProcedureEn:
      '44th Amendment Act, 1978 made Article 21 non-suspendable even during a National Emergency under Article 359.',
    amendmentOrProcedureTe:
      '44వ సవరణ (1978): జాతీయ అత్యవసర పరిస్థితిలో కూడా ఆర్టికల్ 21 రద్దు కాకుండా రక్షించబడింది.',
  },
  {
    id: 'const-art-21a',
    source: 'constitution',
    chapterId: 'part-3',
    chapterTitleEn: 'Part III: Fundamental Rights',
    chapterTitleTe: 'భాగం 3: ప్రాథమిక హక్కులు',
    sectionNumber: 'Article 21A',
    titleEn: 'Right to education for children aged 6 to 14',
    titleTe: 'ఉచిత మరియు నిర్బంధ ప్రాథమిక విద్యా హక్కు',
    verbatimText:
      'The State shall provide free and compulsory education to all children of the age of six to fourteen years in such manner as the State may, by law, determine.',
    simplifiedMeaningEn:
      'Guarantees free and compulsory elementary education to every child in India between 6 and 14 years of age as an enforceable Fundamental Right.',
    simplifiedMeaningTe:
      '6 నుండి 14 సంవత్సరాల పిల్లలందరికీ ఉచిత మరియు నిర్బంధ ప్రాథమిక విద్యను పొందడం రాజ్యాంగబద్ధమైన ప్రాథమిక హక్కు.',
    caseLawsOrPunishmentEn:
      'Society for Unaided Private Schools of Rajasthan v. Union of India (2012) upheld 25% reservation for underprivileged children.',
    caseLawsOrPunishmentTe:
      'రాజస్థాన్ ప్రైవేట్ స్కూల్స్ కేసు (2012): పేద పిల్లలకు 25% సీట్ల రిజర్వేషన్‌ను సుప్రీంకోర్టు సమర్థించింది.',
    amendmentOrProcedureEn:
      'Inserted by the Constitution (86th Amendment) Act, 2002; enacted via RTE Act, 2009.',
    amendmentOrProcedureTe:
      '86వ రాజ్యాంగ సవరణ చట్టం (2002) ద్వారా రాజ్యాంగంలో చేర్చబడింది.',
  },
  {
    id: 'const-art-32',
    source: 'constitution',
    chapterId: 'part-3',
    chapterTitleEn: 'Part III: Fundamental Rights',
    chapterTitleTe: 'భాగం 3: ప్రాథమిక హక్కులు',
    sectionNumber: 'Article 32',
    titleEn: 'Remedies for enforcement of Fundamental Rights (5 Writs)',
    titleTe: 'రాజ్యాంగ పరిహారాల హక్కు (సుప్రీం కోర్టు 5 రకాల రిట్లు)',
    verbatimText:
      '(1) The right to move the Supreme Court by appropriate proceedings for the enforcement of the rights conferred by this Part is guaranteed.\n\n(2) The Supreme Court shall have power to issue directions or orders or writs, including writs in the nature of habeas corpus, mandamus, prohibition, quo warranto and certiorari, whichever may be appropriate, for the enforcement of any of the rights conferred by this Part.',
    simplifiedMeaningEn:
      'Dr. B.R. Ambedkar called Article 32 the "Heart and Soul of the Constitution". Grants citizens the immediate prerogative to seek Supreme Court writs against rights violations.',
    simplifiedMeaningTe:
      'డాక్టర్ బి.ఆర్. అంబేద్కర్ దీనిని "రాజ్యాంగపు ఆత్మ మరియు హృదయం" అని అభివర్ణించారు. ప్రాథమిక హక్కుల రక్షణ కోసం నేరుగా సుప్రీం కోర్టులో 5 రకాల రిట్లు పొందవచ్చు.',
    caseLawsOrPunishmentEn:
      'L. Chandra Kumar v. Union of India (1997): Judicial review under Article 32/226 is an integral part of the Basic Structure.',
    caseLawsOrPunishmentTe:
      'చంద్రకుమార్ కేసు (1997): న్యాయ సమీక్షాధికారం రాజ్యాంగ ప్రాథమిక స్వరూపం.',
    amendmentOrProcedureEn:
      'Includes Habeas Corpus (anti-detention), Mandamus (public duty), Prohibition, Certiorari, and Quo-Warranto.',
    amendmentOrProcedureTe:
      'హెబియస్ కార్పస్, మాండమస్, ప్రొహిబిషన్, సెర్షియోరరి, మరియు కో-వారంటో ఆదేశాలు జారీ చేయబడతాయి.',
  },

  // --- CONSTITUTION: PART IV & IVA ---
  {
    id: 'const-art-39a',
    source: 'constitution',
    chapterId: 'part-4',
    chapterTitleEn: 'Part IV: Directive Principles (DPSP)',
    chapterTitleTe: 'భాగం 4: ఆదేశిక సూత్రాలు (DPSP)',
    sectionNumber: 'Article 39A',
    titleEn: 'Equal justice and free legal aid',
    titleTe: 'సమాన న్యాయం మరియు పేదలకు ఉచిత న్యాయ సహాయం',
    verbatimText:
      'The State shall secure that the operation of the legal system promotes justice, on a basis of equal opportunity, and shall, in particular, provide free legal aid, by suitable legislation or schemes or in any other way, to ensure that opportunities for securing justice are not denied to any citizen by reason of economic or other disabilities.',
    simplifiedMeaningEn:
      'Mandates that economic handicap must never prevent a citizen from receiving legal representation, laying the groundwork for NALSA and free state advocates.',
    simplifiedMeaningTe:
      'ఆర్థిక ఇబ్బందుల కారణంగా ఏ ఒక్కరూ న్యాయానికి దూరం కాకూడదని, పేదలకు ఉచిత న్యాయ సహాయం (NALSA) అందించాలని ఆదేశిస్తుంది.',
    caseLawsOrPunishmentEn:
      'Hussainara Khatoon (1979): Right to free legal aid is an indispensable part of the Article 21 right to a fair trial.',
    caseLawsOrPunishmentTe:
      'హుస్సేనారా ఖాతూన్ కేసు (1979): ఉచిత న్యాయ సహాయం ఫెయిర్ ట్రయల్‌లో అంతర్భాగం.',
    amendmentOrProcedureEn:
      'Inserted by the 42nd Constitutional Amendment Act, 1976; operationalized via Legal Services Authorities Act, 1987.',
    amendmentOrProcedureTe:
      '42వ సవరణ (1976) ద్వారా చేర్చబడింది; టోల్ ఫ్రీ 15100 ద్వారా ఉచిత సేవలు అందుతాయి.',
  },
  {
    id: 'const-art-51a',
    source: 'constitution',
    chapterId: 'part-4a',
    chapterTitleEn: 'Part IVA: Fundamental Duties',
    chapterTitleTe: 'భాగం 4A: ప్రాథమిక విధులు',
    sectionNumber: 'Article 51A',
    titleEn: 'Fundamental duties of every citizen of India',
    titleTe: 'భారత పౌరుల 11 ప్రాథమిక విధులు',
    verbatimText:
      'It shall be the duty of every citizen of India—\n(a) to abide by the Constitution and respect its ideals and institutions, the National Flag and the National Anthem;\n(b) to cherish and follow the noble ideals which inspired our national struggle for freedom;\n(c) to uphold and protect the sovereignty, unity and integrity of India;\n(e) to promote harmony and brotherhood and renounce practices derogatory to women;\n(g) to protect and improve the natural environment including forests, lakes, rivers and wildlife;\n(h) to develop the scientific temper, humanism and the spirit of inquiry and reform;\n(k) for parent/guardian to provide educational opportunities to child between 6 and 14 years.',
    simplifiedMeaningEn:
      'Enumerates 11 core civic responsibilities: fostering scientific temper, respecting the National Flag, protecting wildlife, and honoring the dignity of women.',
    simplifiedMeaningTe:
      'శాస్త్రీయ దృక్పథాన్ని (Scientific Temper) పెంపొందించడం, పర్యావరణాన్ని కాపాడటం, మహిళల గౌరవాన్ని నిలపడం ప్రతి పౌరుని ప్రాథమిక విధి.',
    caseLawsOrPunishmentEn:
      'AIIMS Students Union v. AIIMS (2002): Fundamental duties are equally constitutional and cannot be ignored in statutory interpretation.',
    caseLawsOrPunishmentTe:
      'ఎయిమ్స్ విద్యార్థుల కేసు (2002): ప్రాథమిక విధులు రాజ్యాంగంలో సమాన ప్రాధాన్యత కలిగి ఉంటాయి.',
    amendmentOrProcedureEn:
      'Added by 42nd Amendment Act 1976 (Swaran Singh Committee); 11th duty added by 86th Amendment Act 2002.',
    amendmentOrProcedureTe:
      '42వ సవరణ (1976) ద్వారా చేర్చబడ్డాయి; 11వ విధి 86వ సవరణ (2002) ద్వారా చేర్చబడింది.',
  },

  // --- CONSTITUTION: LANDMARK AMENDMENTS ---
  {
    id: 'const-amend-106',
    source: 'constitution',
    chapterId: 'amendments',
    chapterTitleEn: 'Landmark Amendments (up to 2026)',
    chapterTitleTe: 'చారిత్రక రాజ్యాంగ సవరణలు',
    sectionNumber: '106th Amendment (2023)',
    titleEn: 'Nari Shakti Vandan Adhiniyam (33% Women Reservation)',
    titleTe: 'నారీ శక్తి వందన్ అధినియమం (మహిళలకు 33% చట్టసభల రిజర్వేషన్)',
    verbatimText:
      'The Constitution (One Hundred and Sixth Amendment) Act, 2023 inserts Articles 330A, 332A, and 239AA(2)(ba), mandating that one-third of the total seats in the Lok Sabha, State Legislative Assemblies, and National Capital Territory of Delhi Assembly shall be reserved for women.',
    simplifiedMeaningEn:
      'A historic constitutional transformation guaranteeing 33% reservation for women in Parliament and State Assemblies for an initial 15-year period.',
    simplifiedMeaningTe:
      'లోక్‌సభ మరియు రాష్ట్ర శాసనసభలలో మహిళలకు 33% సీట్లు కేటాయించే చారిత్రక రాజ్యాంగ సవరణ చట్టం (2023).',
    caseLawsOrPunishmentEn:
      'Enacted unanimously across Houses in September 2023, tied to the subsequent Census and Delimitation.',
    caseLawsOrPunishmentTe:
      'పార్లమెంటులో ఏకగ్రీవంగా ఆమోదించబడిన మహిళా సాధికారత చట్టం.',
    amendmentOrProcedureEn:
      '106th Constitutional Amendment Act, 2023; introduces Articles 330A, 332A, and 334A.',
    amendmentOrProcedureTe:
      'రాజ్యాంగంలో కొత్త ఆర్టికల్స్ 330A, 332A, 334A లను చేర్చింది.',
  },

  // ========================================================================
  // INDIAN PENAL CODE (IPC) & BHARATIYA NYAYA SANHITA (BNS 2023)
  // ========================================================================
  {
    id: 'bns-cheating-318',
    source: 'ipc_bns',
    chapterId: 'bns-property',
    chapterTitleEn: 'Chapter X: Offences Against Property',
    chapterTitleTe: 'అధ్యాయం 10: ఆస్తికి సంబంధించిన నేరాలు',
    sectionNumber: 'Section 318, BNS 2023',
    formerCode: 'Former IPC Section 420',
    titleEn: 'Cheating & Dishonestly Inducing Delivery of Property (Scams & Fraud)',
    titleTe: 'మోసం & ఆర్థిక మోసాలు (ఆన్‌లైన్ UPI / బ్యాంకింగ్ స్కామ్‌లు)',
    verbatimText:
      '(1) Whoever cheats shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both.\n\n(4) Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security... shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.',
    simplifiedMeaningEn:
      'Criminalizes defrauding people of money, bank balance, property, or valuable security through false representations, fake KYC calls, or UPI phishing scams.',
    simplifiedMeaningTe:
      'తప్పుడు సమాచారం లేదా నకిలీ వివరాలతో ప్రజల నుండి డబ్బు, బ్యాంక్ బ్యాలెన్స్ లేదా ఆస్తిని దోచుకోవడం తీవ్రమైన నేరం.',
    caseLawsOrPunishmentEn:
      'Rigorous imprisonment up to 7 years + mandatory fine under BNS 318(4). Cognizable and Non-Bailable offence in major financial scams.',
    caseLawsOrPunishmentTe:
      '7 సంవత్సరాల వరకు కఠిన కారాగార శిక్ష మరియు జరిమానా. కాగ్నిజబుల్ మరియు నాన్-బెయిలబుల్ నేరం.',
    amendmentOrProcedureEn:
      'Replaced IPC 420 on July 1, 2024. Reportable to National Cyber Helpline 1930 within the Golden Hour to freeze transited funds.',
    amendmentOrProcedureTe:
      'వెంటనే 1930 నంబరుకు కాల్ చేసి లావాదేవీని ఫ్రీజ్ చేయించి, cybercrime.gov.in లో ఫిర్యాదు చేయాలి.',
  },
  {
    id: 'bns-theft-303',
    source: 'ipc_bns',
    chapterId: 'bns-property',
    chapterTitleEn: 'Chapter X: Offences Against Property',
    chapterTitleTe: 'అధ్యాయం 10: ఆస్తికి సంబంధించిన నేరాలు',
    sectionNumber: 'Section 303, BNS 2023',
    formerCode: 'Former IPC Section 378 / 379',
    titleEn: 'Theft & Unlawful Taking of Movable / Digital Property',
    titleTe: 'దొంగతనం & ఆస్తుల అపహరణ',
    verbatimText:
      '(1) Whoever, intending to take dishonestly any movable property out of the possession of any person without that person’s consent, moves that property in order to such taking, is said to commit theft.\n\n(2) Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both, and in case of second or subsequent conviction... with rigorous imprisonment for a term which shall not be less than one year but which may extend to five years.',
    simplifiedMeaningEn:
      'Penalizes taking any movable asset, vehicle, cash, or digital device out of someone\'s possession without consent with dishonest intention.',
    simplifiedMeaningTe:
      'ఇతరుల అనుమతి లేకుండా వారి వద్ద ఉన్న వాహనం, డబ్బు లేదా ఏదైనా వస్తువును మోసపూరితంగా తీసుకోవడం దొంగతనం కింద పరిగణించబడుతుంది.',
    caseLawsOrPunishmentEn:
      'Imprisonment up to 3 years, or fine, or both; repeat offenders face minimum 1 year up to 5 years rigorous imprisonment.',
    caseLawsOrPunishmentTe:
      '3 సంవత్సరాల వరకు జైలు శిక్ష లేదా జరిమానా; పునరావృతమైతే 5 సంవత్సరాల వరకు కఠిన శిక్ష.',
    amendmentOrProcedureEn:
      'Includes provision for community service for first-time petty theft where stolen value is less than ₹5,000 upon restitution.',
    amendmentOrProcedureTe:
      'రూ. 5,000 కంటే తక్కువ విలువ గల చిన్న దొంగతనాలకు సమాజ సేవ (Community Service) శిక్షను BNS ప్రవేశపెట్టింది.',
  },
  {
    id: 'bns-murder-103',
    source: 'ipc_bns',
    chapterId: 'bns-body',
    chapterTitleEn: 'Chapter VI: Offences Affecting the Human Body',
    chapterTitleTe: 'అధ్యాయం 6: మానవ శరీరంపై జరిగే నేరాలు',
    sectionNumber: 'Section 103, BNS 2023',
    formerCode: 'Former IPC Section 302',
    titleEn: 'Punishment for Murder & Mob Lynching',
    titleTe: 'హత్య మరియు గుంపు దాడి (మాబ్ లించింగ్) శిక్ష',
    verbatimText:
      '(1) Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine.\n\n(2) When a group of five or more persons acting in concert commits murder on the ground of race, caste or community, sex, place of birth, language, personal belief or any other similar ground, each member of such group shall be punished with death or with imprisonment for life, and shall also be liable to fine.',
    simplifiedMeaningEn:
      'Punishes culpable homicide amounting to murder, and introduces a dedicated statutory penalty for Mob Lynching committed by five or more persons.',
    simplifiedMeaningTe:
      'హత్యకు మరణశిక్ష లేదా జీవిత ఖైదు విధించబడుతుంది. కులం, మతం, భాష పేరుతో 5 గురు లేదా అంతకంటే ఎక్కువ మంది చేసే గుంపు దాడి (Lynching) కి కఠిన శిక్ష విధిస్తారు.',
    caseLawsOrPunishmentEn:
      'Capital punishment (Death sentence) or Imprisonment for Life + mandatory fine. Strictly Non-Bailable.',
    caseLawsOrPunishmentTe:
      'ఉరిశిక్ష లేదా జీవిత ఖైదు మరియు జరిమానా. పూర్తిగా నాన్-బెయిలబుల్.',
    amendmentOrProcedureEn:
      'Sub-section (2) codifies specific statutory punishment for hate-motivated group lynching for the first time in Indian criminal law.',
    amendmentOrProcedureTe:
      'భారత న్యాయ చరిత్రలో మొదటిసారిగా మాబ్ లించింగ్ కోసం ప్రత్యేక సబ్-సెక్షన్ 103(2) చేర్చబడింది.',
  },
  {
    id: 'bns-women-stalking-78',
    source: 'ipc_bns',
    chapterId: 'bns-women',
    chapterTitleEn: 'Chapter VII: Crimes Against Women & Children',
    chapterTitleTe: 'అధ్యాయం 7: మహిళలు మరియు పిల్లలపై నేరాలు',
    sectionNumber: 'Section 78, BNS 2023',
    formerCode: 'Former IPC Section 354D',
    titleEn: 'Stalking, Cyber Stalking & Electronic Monitoring of Women',
    titleTe: 'స్టాకింగ్ & సోషల్ మీడియాలో మహిళలను వేధించడం',
    verbatimText:
      '(1) Any man who—\n(i) follows a woman and contacts, or attempts to contact such woman to foster personal interaction repeatedly despite a clear indication of disinterest... or\n(ii) monitors the use by a woman of the internet, email or any other form of electronic communication, commits the offence of stalking.\n\n(2) Whoever commits the offence of stalking shall be punished on first conviction with imprisonment of either description for a term which may extend to three years, and shall also be liable to fine; and on a second or subsequent conviction, with imprisonment for a term which may extend to five years.',
    simplifiedMeaningEn:
      'Protects women from physical following, online surveillance, repetitive cyber harassment, and tracking via social media, WhatsApp, or location tools.',
    simplifiedMeaningTe:
      'ఇష్టం లేకపోయినా మహిళలను వెంబడించడం, సోషల్ మీడియా లేదా ఫోన్ ద్వారా వారి కార్యకలాపాలను నిరంతరం పర్యవేక్షించడం చట్టరీత్యా నేరం.',
    caseLawsOrPunishmentEn:
      'First conviction: Imprisonment up to 3 years + fine (Bailable); Second conviction: Up to 5 years (Non-Bailable).',
    caseLawsOrPunishmentTe:
      'మొదటిసారి 3 ఏళ్ల జైలు శిక్ష; రెండోసారి 5 సంవత్సరాల జైలు శిక్ష (నాన్-బెయిలబుల్).',
    amendmentOrProcedureEn:
      'Combined with Sections 66E, 67, 67A of the IT Act 2000 for digital media morphing or online extortion.',
    amendmentOrProcedureTe:
      'ఐటీ చట్టం 66E మరియు 67A లతో కలిపి సైబర్ సెల్‌లో కేసు నమోదు చేస్తారు.',
  },
  {
    id: 'bns-defamation-356',
    source: 'ipc_bns',
    chapterId: 'bns-reputation',
    chapterTitleEn: 'Chapter XIV: Defamation & Criminal Intimidation',
    chapterTitleTe: 'అధ్యాయం 14: పరువు నష్టం & నేరపూరిత బెదిరింపులు',
    sectionNumber: 'Section 356, BNS 2023',
    formerCode: 'Former IPC Section 499 / 500',
    titleEn: 'Defamation (Public & Social Media False Allegations)',
    titleTe: 'పరువు నష్టం (ఆన్‌లైన్ & బహిరంగ నిందారోపణలు)',
    verbatimText:
      '(1) Whoever, by words either spoken or intended to be read, or by signs or by visible representations, makes or publishes concerning any person any imputation intending to harm... the reputation of such person, is said to defame that person.\n\n(2) Whoever defames another shall be punished with simple imprisonment for a term which may extend to two years, or with fine, or with both, or with community service.',
    simplifiedMeaningEn:
      'Penalizes publishing false, damaging statements about someone\'s character in print, speech, video, or social media posts.',
    simplifiedMeaningTe:
      'ఇతరుల వ్యక్తిత్వానికి లేదా పరువుకు భంగం కలిగించేలా సోషల్ మీడియాలో లేదా బహిరంగంగా అసత్య ఆరోపణలు చేయడం నేరం.',
    caseLawsOrPunishmentEn:
      'Simple imprisonment up to 2 years, or fine, or community service (introduced under BNS).',
    caseLawsOrPunishmentTe:
      '2 సంవత్సరాల వరకు జైలు శిక్ష, లేదా జరిమానా, లేదా సమాజ సేవ.',
    amendmentOrProcedureEn:
      'Community service can be awarded by the Court as an alternative correctional measure.',
    amendmentOrProcedureTe:
      'బాధితునికి క్షమాపణతో పాటు కమ్యూనిటీ సర్వీస్ విధించే వెసులుబాటును BNS కల్పించింది.',
  },
  {
    id: 'bns-zero-fir-173',
    source: 'ipc_bns',
    chapterId: 'bnss-procedure',
    chapterTitleEn: 'BNSS 2023: Criminal Procedure & Rights',
    chapterTitleTe: 'భారతీయ నాగరిక్ సురక్ష సంహిత (BNSS): పౌరుల హక్కులు',
    sectionNumber: 'Section 173, BNSS 2023',
    formerCode: 'Former Section 154 CrPC',
    titleEn: 'Right to Zero FIR & Electronic e-FIR Registration',
    titleTe: 'జీరో ఎఫ్ఐఆర్ & ఈ-ఎఫ్ఐఆర్ దాఖలు చేసుకునే చట్టబద్ధ హక్కు',
    verbatimText:
      '(1) Every information relating to the commission of a cognizable offence, irrespective of the area where the offence is committed, may be given orally or by electronic communication to an officer in charge of a police station.\n\nProvided that if the information is given by electronic communication, it shall be taken on record on being signed by the person within three days...\n\n(2) A copy of the information as recorded shall be given forthwith, free of cost, to the informant or the complainant.',
    simplifiedMeaningEn:
      'Statutory right to register a Zero FIR at ANY police station in India regardless of jurisdiction, plus the ability to submit an electronic e-FIR.',
    simplifiedMeaningTe:
      'పరిధి (Jurisdiction) తో సంబంధం లేకుండా దేశంలోని ఏ పోలీస్ స్టేషన్‌లోనైనా జీరో ఎఫ్ఐఆర్ నమోదు చేయవచ్చు. ఉచితంగా ఎఫ్ఐఆర్ కాపీ పొందడం పౌరుని హక్కు.',
    caseLawsOrPunishmentEn:
      'Lalita Kumari (2013): Mandatory registration of FIR if information discloses a cognizable offence.',
    caseLawsOrPunishmentTe:
      'లలిత కుమారి తీర్పు (2013): కాగ్నిజబుల్ నేరం జరిగినప్పుడు ఎఫ్ఐఆర్ నమోదు చేయడం పోలీసుల తప్పనిసరి విధి.',
    amendmentOrProcedureEn:
      'If an officer refuses, send complaint to the Superintendent of Police under BNSS 173(4) or approach the Judicial Magistrate under 175(3).',
    amendmentOrProcedureTe:
      'పోలీసులు నిరాకరిస్తే జిల్లా ఎస్పీకి లేదా మేజిస్ట్రేట్ కోర్టుకు నేరుగా ఫిర్యాదు చేయవచ్చు.',
  },
];

// CHAPTER GROUPS FOR THE TABS
const CONSTITUTION_CHAPTERS = [
  { id: 'preamble', labelEn: 'Preamble', labelTe: 'పీఠిక' },
  { id: 'part-1', labelEn: 'Part I: Territory', labelTe: 'భాగం 1: భూభాగం' },
  { id: 'part-3', labelEn: 'Part III: Rights', labelTe: 'భాగం 3: హక్కులు' },
  { id: 'part-4', labelEn: 'Part IV: DPSP', labelTe: 'భాగం 4: ఆదేశిక సూత్రాలు' },
  { id: 'part-4a', labelEn: 'Part IVA: Duties', labelTe: 'భాగం 4A: విధులు' },
  { id: 'amendments', labelEn: 'Amendments', labelTe: 'సవరణలు' },
];

const IPC_BNS_CHAPTERS = [
  { id: 'bns-property', labelEn: 'Offences: Property', labelTe: 'ఆస్తి నేరాలు' },
  { id: 'bns-body', labelEn: 'Offences: Body & Murder', labelTe: 'శరీర నేరాలు' },
  { id: 'bns-women', labelEn: 'Crimes: Women', labelTe: 'మహిళా రక్షణ' },
  { id: 'bns-reputation', labelEn: 'Defamation', labelTe: 'పరువు నష్టం' },
  { id: 'bnss-procedure', labelEn: 'BNSS Zero FIR', labelTe: 'జీరో ఎఫ్ఐఆర్' },
];

export interface BookViewProps {
  initialSection?: BookSection;
  initialTheme?: BookTheme;
  onSectionChange?: (sec: BookSection) => void;
  onThemeChange?: (theme: BookTheme) => void;
}

export function BookView({
  initialSection = 'constitution',
  initialTheme = 'parchment',
  onSectionChange,
  onThemeChange,
}: BookViewProps = {}) {
  const [activeSection, setActiveSection] = useState<BookSection>(initialSection);
  const [activeChapterId, setActiveChapterId] = useState<string>('part-3');
  const [theme, setTheme] = useState<BookTheme>(initialTheme);
  const [langMode, setLangMode] = useState<'bilingual' | 'english' | 'telugu'>('bilingual');
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(0); // -1, 0, +1, +2
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEntryId, setSelectedEntryId] = useState<string>('const-art-21');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Filter entries based on activeSection and chapter or search
  const visibleEntries = useMemo(() => {
    return BOOK_ENTRIES.filter((entry) => {
      const matchSection = entry.source === activeSection;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          entry.sectionNumber.toLowerCase().includes(q) ||
          entry.titleEn.toLowerCase().includes(q) ||
          entry.titleTe.toLowerCase().includes(q) ||
          entry.verbatimText.toLowerCase().includes(q) ||
          entry.simplifiedMeaningEn.toLowerCase().includes(q)
        );
      }
      return matchSection && entry.chapterId === activeChapterId;
    });
  }, [activeSection, activeChapterId, searchQuery]);

  // Active current entry
  const activeEntry = useMemo(() => {
    const found = BOOK_ENTRIES.find((e) => e.id === selectedEntryId);
    if (found) return found;
    return visibleEntries[0] || BOOK_ENTRIES[0];
  }, [selectedEntryId, visibleEntries]);

  // Page index navigation
  const currentIndex = visibleEntries.findIndex((e) => e.id === activeEntry.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < visibleEntries.length - 1;

  const handlePrevPage = () => {
    if (hasPrev) {
      setSelectedEntryId(visibleEntries[currentIndex - 1].id);
    }
  };

  const handleNextPage = () => {
    if (hasNext) {
      setSelectedEntryId(visibleEntries[currentIndex + 1].id);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langMode === 'telugu' ? 'te-IN' : 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Font size classes
  const fontClass =
    fontSizeLevel === -1
      ? 'text-xs leading-relaxed'
      : fontSizeLevel === 1
      ? 'text-base leading-loose'
      : fontSizeLevel === 2
      ? 'text-lg leading-loose'
      : 'text-sm leading-relaxed';

  // Theme style mapping for realistic paper feel
  const themeStyles = {
    parchment: {
      outerBg: 'bg-[#181410] border-[#3D2C1E]',
      bookPage: 'bg-[#FBF8F1] text-[#241A12] border-[#D4C3A3]',
      paperTexture: 'shadow-[inset_0_0_40px_rgba(180,140,80,0.18),0_15px_35px_rgba(0,0,0,0.5)]',
      spineGutter: 'via-[#D6C4A4]/40',
      headerBorder: 'border-[#D9C8AA]',
      accentBadge: 'bg-[#8B5A2B]/15 text-[#6B3D1B] border-[#C8A97E]',
      quoteBox: 'bg-[#F5EFE0] border-l-[#8B5A2B] text-[#2D2115]',
      metaBox: 'bg-[#F4ECE1] border-[#DFD1BD] text-[#3A2D20]',
      goldTrim: 'text-[#8B5A2B]',
    },
    ivory: {
      outerBg: 'bg-[#0F172A] border-[#1E293B]',
      bookPage: 'bg-[#FDFBF7] text-[#0F172A] border-[#E2E8F0]',
      paperTexture: 'shadow-[inset_0_0_35px_rgba(0,0,0,0.06),0_15px_35px_rgba(0,0,0,0.4)]',
      spineGutter: 'via-slate-200/50',
      headerBorder: 'border-slate-200',
      accentBadge: 'bg-amber-500/15 text-amber-900 border-amber-300',
      quoteBox: 'bg-[#F8F6F0] border-l-amber-600 text-[#1E293B]',
      metaBox: 'bg-[#F1EFEA] border-slate-200 text-[#334155]',
      goldTrim: 'text-amber-700',
    },
    midnight: {
      outerBg: 'bg-[#080B11] border-[#1F2937]',
      bookPage: 'bg-[#0D131F] text-[#E2E8F0] border-[#2A374A]',
      paperTexture: 'shadow-[inset_0_0_45px_rgba(0,0,0,0.6),0_15px_35px_rgba(0,0,0,0.8)]',
      spineGutter: 'via-cyan-900/30',
      headerBorder: 'border-[#1E2B3E]',
      accentBadge: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
      quoteBox: 'bg-[#131C2D] border-l-amber-400 text-slate-200',
      metaBox: 'bg-[#101826] border-[#1F2E45] text-slate-300',
      goldTrim: 'text-amber-400',
    },
  }[theme];

  return (
    <div
      className={`relative rounded-3xl border ${themeStyles.outerBg} p-3 sm:p-6 transition-all duration-300 shadow-2xl ${
        isFullScreen ? 'fixed inset-2 z-50 overflow-y-auto' : ''
      }`}
    >
      {/* Top Leatherbound Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        {/* Left: Codex Title & Major Section Switcher (Constitution vs IPC/BNS) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  BOOKVIEW CODEX
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                  భారత న్యాయ గ్రంథం
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white font-serif">
                Authentic Legal Tome (1950–2026)
              </h2>
            </div>
          </div>

          {/* Section Selector: Constitution vs IPC / BNS */}
          <div className="flex items-center bg-slate-900/90 border border-white/10 p-1 rounded-xl shrink-0">
            <button
              onClick={() => {
                setActiveSection('constitution');
                setActiveChapterId('part-3');
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSection === 'constitution'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Constitution of India</span>
            </button>

            <button
              onClick={() => {
                setActiveSection('ipc_bns');
                setActiveChapterId('bns-property');
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSection === 'ipc_bns'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>BNS 2023 & IPC</span>
            </button>
          </div>
        </div>

        {/* Right: Theme Switcher, Font Resizer, Language, Fullscreen */}
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {/* Paper Theme Picker */}
          <div className="flex items-center bg-slate-900/90 border border-white/10 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setTheme('parchment')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                theme === 'parchment'
                  ? 'bg-[#EADDC7] text-[#362615] font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Antique Aged Parchment Paper"
            >
              📜 Parchment
            </button>
            <button
              onClick={() => setTheme('ivory')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                theme === 'ivory'
                  ? 'bg-white text-slate-900 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Royal Ivory Paper"
            >
              📄 Ivory
            </button>
            <button
              onClick={() => setTheme('midnight')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                theme === 'midnight'
                  ? 'bg-slate-800 text-amber-300 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Midnight Leather Codex"
            >
              🌙 Midnight
            </button>
          </div>

          {/* Font Resizer */}
          <div className="flex items-center bg-slate-900/90 border border-white/10 p-1 rounded-xl text-xs font-mono">
            <button
              onClick={() => setFontSizeLevel((prev) => Math.max(-1, prev - 1))}
              disabled={fontSizeLevel <= -1}
              className="px-2 py-0.5 rounded text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Decrease Font Size"
            >
              A-
            </button>
            <span className="px-1.5 text-amber-400 font-bold">Aa</span>
            <button
              onClick={() => setFontSizeLevel((prev) => Math.min(2, prev + 1))}
              disabled={fontSizeLevel >= 2}
              className="px-2 py-0.5 rounded text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center bg-slate-900/90 border border-white/10 p-1 rounded-xl text-xs font-medium">
            <Languages className="w-3.5 h-3.5 text-amber-400 ml-1 mr-1" />
            <button
              onClick={() => setLangMode('bilingual')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                langMode === 'bilingual' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bilingual
            </button>
            <button
              onClick={() => setLangMode('telugu')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                langMode === 'telugu' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              తెలుగు
            </button>
            <button
              onClick={() => setLangMode('english')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                langMode === 'english' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* Full Screen Toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 rounded-xl bg-slate-900/90 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title={isFullScreen ? 'Exit Fullscreen Book' : 'Fullscreen Book View'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chapter Navigation Tabs Bar */}
      <div className="pt-3 pb-1 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar scrollbar-none">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {(activeSection === 'constitution' ? CONSTITUTION_CHAPTERS : IPC_BNS_CHAPTERS).map((ch) => {
            const isActive = activeChapterId === ch.id && !searchQuery.trim();
            return (
              <button
                key={ch.id}
                onClick={() => {
                  setActiveChapterId(ch.id);
                  setSearchQuery('');
                  // Auto select first entry in chapter
                  const first = BOOK_ENTRIES.find(
                    (e) => e.source === activeSection && e.chapterId === ch.id
                  );
                  if (first) setSelectedEntryId(first.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold whitespace-nowrap transition cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-102'
                    : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{ch.labelEn}</span>
                <span className="text-[10px] opacity-75 ml-1">({ch.labelTe})</span>
              </button>
            );
          })}
        </div>

        {/* Quick Search within book */}
        <div className="relative min-w-[200px] sm:min-w-[240px] shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search article, section, clause..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>
      </div>

      {/* Main Real Book Container */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Drawer / Table of Articles in Selected Chapter */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3.5 space-y-2 max-h-[580px] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ScrollText className="w-3.5 h-3.5" />
                {searchQuery ? 'Search Results' : 'Chapter Articles'} ({visibleEntries.length})
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Page {currentIndex + 1} of {Math.max(1, visibleEntries.length)}
              </span>
            </div>

            <div className="space-y-1.5">
              {visibleEntries.map((entry, idx) => {
                const isSelected = entry.id === activeEntry.id;
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntryId(entry.id)}
                    className={`w-full text-left p-3 rounded-xl border transition cursor-pointer font-serif ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400/80 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-amber-400">
                        {entry.sectionNumber}
                      </span>
                      {entry.formerCode && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {entry.formerCode}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-100 mt-1 line-clamp-1 font-serif">
                      {entry.titleEn}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {entry.titleTe}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Tome / Realistic Paper Page with Gutter, Ribbon, and Serif Typography */}
        <div className="lg:col-span-8">
          <div
            className={`relative rounded-2xl border ${themeStyles.bookPage} ${themeStyles.paperTexture} p-6 sm:p-9 min-h-[580px] flex flex-col justify-between overflow-hidden transition-all duration-300`}
          >
            {/* Book Spine Crease Shadow overlay (down the left side for realistic depth) */}
            <div
              className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r ${themeStyles.spineGutter} to-transparent z-10`}
            />

            {/* Header: Book Heading & Part */}
            <div className={`pb-4 border-b ${themeStyles.headerBorder} space-y-2`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${themeStyles.accentBadge}`}
                    >
                      {activeEntry.chapterTitleEn}
                    </span>
                    <span className="text-[11px] font-mono opacity-60">
                      [{activeEntry.chapterTitleTe}]
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black font-serif tracking-tight mt-1">
                    {activeEntry.sectionNumber}: {activeEntry.titleEn}
                  </h3>
                  <p className="text-xs opacity-75 font-serif italic mt-0.5">
                    {activeEntry.titleTe}
                  </p>
                </div>

                {/* Actions: Listen, Copy, JSON */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => handleSpeak(activeEntry.verbatimText)}
                    className="p-1.5 px-2.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Read Aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Read</span>
                  </button>

                  <button
                    onClick={() => {
                      const bookQuote = `📖 **[${activeEntry.chapterTitleEn}]**\n🏛️ **${activeEntry.sectionNumber}: ${activeEntry.titleEn}**\n---\n**Exact Legal Text / Provision:**\n> "${activeEntry.verbatimText}"\n\n**Simplified Explanation:**\n- Key Takeaway: ${activeEntry.simplifiedMeaningEn}\n- Landmark Case Laws / Penalties: ${activeEntry.caseLawsOrPunishmentEn}\n- Amendments / Procedure: ${activeEntry.amendmentOrProcedureEn}\n---`;
                      handleCopy(bookQuote, 'citation');
                    }}
                    className="p-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-sm"
                    title="Copy Book Citation"
                  >
                    {copiedKey === 'citation' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-950" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Citation</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowJsonModal(!showJsonModal)}
                    className="p-1.5 px-2 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition text-xs font-mono font-bold cursor-pointer"
                    title="Toggle UI JSON"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Article Body with Classical Drop Cap and Serif Typography */}
            <div className="my-6 space-y-6 flex-1">
              {/* Exact Verbatim Legal Text */}
              <div className="space-y-2">
                <span
                  className={`text-[11px] font-mono font-bold uppercase tracking-wider block ${themeStyles.goldTrim}`}
                >
                  § EXACT STATUTORY PROVISION / LEGAL TEXT:
                </span>

                <div
                  className={`rounded-2xl p-5 border-l-4 font-serif ${themeStyles.quoteBox} ${fontClass} whitespace-pre-wrap leading-relaxed shadow-sm`}
                >
                  {/* First Paragraph Drop Cap Styling */}
                  &ldquo;{activeEntry.verbatimText}&rdquo;
                </div>
              </div>

              {/* Simplified Plain-Language Explanation */}
              <div className={`rounded-2xl p-5 border ${themeStyles.metaBox} space-y-3`}>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block">
                  ✦ SIMPLIFIED CITIZEN TAKEAWAY:
                </span>

                <div className={`space-y-2 ${fontClass}`}>
                  <div>
                    <strong className="block font-serif text-sm">• English Meaning:</strong>
                    <p className="leading-relaxed opacity-90">
                      {activeEntry.simplifiedMeaningEn}
                    </p>
                  </div>

                  {(langMode === 'bilingual' || langMode === 'telugu') && (
                    <div className="pt-2 border-t border-black/10 dark:border-white/10">
                      <strong className="block font-serif text-sm">• తెలుగు వివరణ:</strong>
                      <p className="leading-relaxed opacity-90 text-amber-900 dark:text-amber-200">
                        {activeEntry.simplifiedMeaningTe}
                      </p>
                    </div>
                  )}

                  {/* Case Laws / Punishment Details */}
                  <div className="pt-2 border-t border-black/10 dark:border-white/10">
                    <strong className="block font-serif text-sm">
                      • {activeEntry.source === 'constitution' ? 'Landmark Case Law / Doctrine:' : 'Penalties & Punishment:'}
                    </strong>
                    <p className="leading-relaxed opacity-90">
                      {langMode === 'telugu'
                        ? activeEntry.caseLawsOrPunishmentTe
                        : activeEntry.caseLawsOrPunishmentEn}
                    </p>
                  </div>

                  {/* Historical Amendments / Actionable Procedure */}
                  <div className="pt-2 border-t border-black/10 dark:border-white/10">
                    <strong className="block font-serif text-sm">
                      • {activeEntry.source === 'constitution' ? 'Historical Amendments:' : 'Actionable Legal Procedure:'}
                    </strong>
                    <p className="leading-relaxed opacity-90">
                      {langMode === 'telugu'
                        ? activeEntry.amendmentOrProcedureTe
                        : activeEntry.amendmentOrProcedureEn}
                    </p>
                  </div>
                </div>
              </div>

              {/* Raw UI JSON Preview (If toggled) */}
              {showJsonModal && (
                <div className="rounded-xl bg-slate-950 border border-amber-500/40 p-4 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400">
                    <span>UI DATA JSON PAYLOAD:</span>
                    <button
                      onClick={() => {
                        const jsonPayload = {
                          part: activeEntry.chapterTitleEn,
                          partTitle: activeEntry.chapterTitleTe,
                          articleNumber: activeEntry.sectionNumber,
                          heading: activeEntry.titleEn,
                          content: activeEntry.verbatimText,
                          simplifiedNotes: activeEntry.simplifiedMeaningEn,
                          amendments: activeEntry.amendmentOrProcedureEn,
                        };
                        handleCopy(JSON.stringify(jsonPayload, null, 2), 'raw_json');
                      }}
                      className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold"
                    >
                      {copiedKey === 'raw_json' ? 'Copied!' : 'Copy JSON'}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-amber-200 overflow-x-auto max-h-48 p-2">
                    {JSON.stringify(
                      {
                        part: activeEntry.chapterTitleEn,
                        partTitle: activeEntry.chapterTitleTe,
                        articleNumber: activeEntry.sectionNumber,
                        heading: activeEntry.titleEn,
                        content: activeEntry.verbatimText,
                        simplifiedNotes: activeEntry.simplifiedMeaningEn,
                        amendments: activeEntry.amendmentOrProcedureEn,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>

            {/* Bottom Book Navigation (Previous Page / Next Page) */}
            <div className={`pt-4 border-t ${themeStyles.headerBorder} flex items-center justify-between`}>
              <button
                onClick={handlePrevPage}
                disabled={!hasPrev}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition cursor-pointer border ${
                  hasPrev
                    ? 'bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border-black/10 dark:border-white/10'
                    : 'opacity-25 cursor-not-allowed border-transparent'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Provision</span>
              </button>

              <div className="text-center font-serif text-xs opacity-70">
                <span>✦ Authentic Law Codex ✦</span>
                <span className="block text-[10px] font-mono">
                  Page {currentIndex + 1} of {visibleEntries.length}
                </span>
              </div>

              <button
                onClick={handleNextPage}
                disabled={!hasNext}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition cursor-pointer border ${
                  hasNext
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                    : 'opacity-25 cursor-not-allowed border-transparent'
                }`}
              >
                <span>Next Provision</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
