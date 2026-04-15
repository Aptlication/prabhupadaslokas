export interface WordMeaning {
  word: string;
  meaning: string;
}

export interface Sloka {
  id: string;
  title: string;
  source: string;
  devanagari: string[];
  transliteration: string[];
  translation: string;
  purport?: string;
  word_by_word: WordMeaning[];
  audio_url?: string;
  category: string;
}

export const slokas: Sloka[] = [
  {
    id: "bg_2_13",
    title: "Bhagavad Gita 2.13",
    source: "Bhagavad Gita As It Is",
    category: "Bhagavad Gita",
    devanagari: [
      "देहिनोऽस्मिन्यथा देहे कौमारं यौवनं जरा ।",
      "तथा देहान्तरप्राप्तिर्धीरस्तत्र न मुह्यति ॥",
    ],
    transliteration: [
      "dehino 'smin yathā dehe",
      "kaumāraṁ yauvanaṁ jarā",
      "tathā dehāntara-prāptir",
      "dhīras tatra na muhyati",
    ],
    translation:
      "As the embodied soul continuously passes, in this body, from boyhood to youth to old age, the soul similarly passes into another body at death. A sober person is not bewildered by such a change.",
    purport:
      "Since every living entity is an individual soul, each is changing his body every moment, manifesting sometimes as a child, sometimes as a youth, and sometimes as an old man.",
    word_by_word: [
      { word: "dehinaḥ", meaning: "of the embodied soul" },
      { word: "asmin", meaning: "in this" },
      { word: "yathā", meaning: "as" },
      { word: "dehe", meaning: "in the body" },
      { word: "kaumāram", meaning: "boyhood" },
      { word: "yauvanam", meaning: "youth" },
      { word: "jarā", meaning: "old age" },
      { word: "tathā", meaning: "similarly" },
      { word: "deha-antara", meaning: "of transference of the body" },
      { word: "prāptiḥ", meaning: "achievement" },
      { word: "dhīraḥ", meaning: "the sober" },
      { word: "tatra", meaning: "thereupon" },
      { word: "na", meaning: "never" },
      { word: "muhyati", meaning: "is deluded" },
    ],
  },
  {
    id: "bg_2_20",
    title: "Bhagavad Gita 2.20",
    source: "Bhagavad Gita As It Is",
    category: "Bhagavad Gita",
    devanagari: [
      "न जायते म्रियते वा कदाचिन् नायं भूत्वा भविता वा न भूयः ।",
      "अजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे ॥",
    ],
    transliteration: [
      "na jāyate mriyate vā kadācin",
      "nāyaṁ bhūtvā bhavitā vā na bhūyaḥ",
      "ajo nityaḥ śāśvato 'yaṁ purāṇo",
      "na hanyate hanyamāne śarīre",
    ],
    translation:
      "For the soul there is neither birth nor death at any time. He has not come into being, does not come into being, and will not come into being. He is unborn, eternal, ever-existing, and primeval. He is not slain when the body is slain.",
    word_by_word: [
      { word: "na", meaning: "never" },
      { word: "jāyate", meaning: "takes birth" },
      { word: "mriyate", meaning: "dies" },
      { word: "vā", meaning: "either" },
      { word: "kadācit", meaning: "at any time (past, present, or future)" },
      { word: "na", meaning: "never" },
      { word: "ayam", meaning: "this" },
      { word: "bhūtvā", meaning: "having come into being" },
      { word: "bhavitā", meaning: "will come to be" },
      { word: "vā", meaning: "or" },
      { word: "na", meaning: "not" },
      { word: "bhūyaḥ", meaning: "or is again coming to be" },
      { word: "ajaḥ", meaning: "unborn" },
      { word: "nityaḥ", meaning: "eternal" },
      { word: "śāśvataḥ", meaning: "permanent" },
      { word: "ayam", meaning: "this" },
      { word: "purāṇaḥ", meaning: "the oldest" },
      { word: "na", meaning: "never" },
      { word: "hanyate", meaning: "is killed" },
      { word: "hanyamāne", meaning: "being killed" },
      { word: "śarīre", meaning: "the body" },
    ],
  },
  {
    id: "bg_4_7",
    title: "Bhagavad Gita 4.7",
    source: "Bhagavad Gita As It Is",
    category: "Bhagavad Gita",
    devanagari: [
      "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत ।",
      "अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥",
    ],
    transliteration: [
      "yadā yadā hi dharmasya",
      "glānir bhavati bhārata",
      "abhyutthānam adharmasya",
      "tadātmānaṁ sṛjāmy aham",
    ],
    translation:
      "Whenever and wherever there is a decline in religious practice, O descendant of Bharata, and a predominant rise of irreligion — at that time I descend Myself.",
    word_by_word: [
      { word: "yadā yadā", meaning: "whenever and wherever" },
      { word: "hi", meaning: "certainly" },
      { word: "dharmasya", meaning: "of religion" },
      { word: "glāniḥ", meaning: "discrepancies" },
      { word: "bhavati", meaning: "become manifested" },
      { word: "bhārata", meaning: "O descendant of Bharata" },
      { word: "abhyutthānam", meaning: "predominance" },
      { word: "adharmasya", meaning: "of irreligion" },
      { word: "tadā", meaning: "at that time" },
      { word: "ātmānam", meaning: "self" },
      { word: "sṛjāmi", meaning: "manifest" },
      { word: "aham", meaning: "I" },
    ],
  },
  {
    id: "bg_9_22",
    title: "Bhagavad Gita 9.22",
    source: "Bhagavad Gita As It Is",
    category: "Bhagavad Gita",
    devanagari: [
      "अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते ।",
      "तेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम् ॥",
    ],
    transliteration: [
      "ananyāś cintayanto māṁ",
      "ye janāḥ paryupāsate",
      "teṣāṁ nityābhiyuktānāṁ",
      "yoga-kṣemaṁ vahāmy aham",
    ],
    translation:
      "But those who always worship Me with exclusive devotion, meditating on My transcendental form — to them I carry what they lack, and I preserve what they have.",
    word_by_word: [
      { word: "ananyāḥ", meaning: "having no other object" },
      { word: "cintayantaḥ", meaning: "concentrating" },
      { word: "mām", meaning: "unto Me" },
      { word: "ye", meaning: "those who" },
      { word: "janāḥ", meaning: "persons" },
      { word: "paryupāsate", meaning: "worship properly" },
      { word: "teṣām", meaning: "of them" },
      { word: "nitya-abhiyuktānām", meaning: "always engaged" },
      { word: "yoga", meaning: "requirements" },
      { word: "kṣemam", meaning: "protection" },
      { word: "vahāmi", meaning: "I carry" },
      { word: "aham", meaning: "I" },
    ],
  },
  {
    id: "bg_18_66",
    title: "Bhagavad Gita 18.66",
    source: "Bhagavad Gita As It Is",
    category: "Bhagavad Gita",
    devanagari: [
      "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज ।",
      "अहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः ॥",
    ],
    transliteration: [
      "sarva-dharmān parityajya",
      "mām ekaṁ śaraṇaṁ vraja",
      "ahaṁ tvāṁ sarva-pāpebhyo",
      "mokṣayiṣyāmi mā śucaḥ",
    ],
    translation:
      "Abandon all varieties of religion and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.",
    word_by_word: [
      { word: "sarva-dharmān", meaning: "all varieties of religion" },
      { word: "parityajya", meaning: "abandoning" },
      { word: "mām", meaning: "unto Me" },
      { word: "ekam", meaning: "only" },
      { word: "śaraṇam", meaning: "surrender" },
      { word: "vraja", meaning: "go" },
      { word: "aham", meaning: "I" },
      { word: "tvām", meaning: "you" },
      { word: "sarva", meaning: "all" },
      { word: "pāpebhyaḥ", meaning: "from sinful reactions" },
      { word: "mokṣayiṣyāmi", meaning: "will deliver" },
      { word: "mā", meaning: "do not" },
      { word: "śucaḥ", meaning: "fear" },
    ],
  },
  {
    id: "siksastakam_1",
    title: "Śikṣāṣṭakam 1",
    source: "Śrī Caitanya Mahāprabhu",
    category: "Prayers",
    devanagari: [
      "चेतोदर्पणमार्जनं भवमहादावाग्निनिर्वापणं",
      "श्रेयःकैरवचन्द्रिकावितरणं विद्यावधूजीवनम् ।",
      "आनन्दाम्बुधिवर्धनं प्रतिपदं पूर्णामृतास्वादनं",
      "सर्वात्मस्नपनं परं विजयते श्रीकृष्णसङ्कीर्तनम् ॥",
    ],
    transliteration: [
      "ceto-darpaṇa-mārjanaṁ bhava-mahā-dāvāgni-nirvāpaṇaṁ",
      "śreyaḥ-kairava-candrikā-vitaraṇaṁ vidyā-vadhū-jīvanam",
      "ānandāmbudhi-varddhanaṁ prati-padaṁ pūrṇāmṛtāsvādanaṁ",
      "sarvātma-snapanaṁ paraṁ vijayate śrī-kṛṣṇa-saṅkīrtanam",
    ],
    translation:
      "Glory to the Śrī Kṛṣṇa saṅkīrtana, which cleanses the heart of all the dust accumulated for years and extinguishes the fire of conditional life, of repeated birth and death. This saṅkīrtana movement is the prime benediction for humanity at large because it spreads the rays of the benediction moon. It is the life of all transcendental knowledge. It increases the ocean of transcendental bliss, and it enables us to fully taste the nectar for which we are always anxious.",
    word_by_word: [
      { word: "ceto", meaning: "of the heart" },
      { word: "darpaṇa", meaning: "mirror" },
      { word: "mārjanam", meaning: "cleansing" },
      { word: "bhava", meaning: "of conditional life" },
      { word: "mahā-dāva", meaning: "of the great forest fire" },
      { word: "agni", meaning: "fire" },
      { word: "nirvāpaṇam", meaning: "extinguishing" },
      { word: "śreyaḥ", meaning: "of good fortune" },
      { word: "kairava", meaning: "of the white lotus" },
      { word: "candrikā", meaning: "moonshine" },
      { word: "vitaraṇam", meaning: "spreading" },
      { word: "vidyā", meaning: "of all education" },
      { word: "vadhū", meaning: "wife" },
      { word: "jīvanam", meaning: "life" },
      { word: "ānanda", meaning: "of bliss" },
      { word: "ambudhi", meaning: "ocean" },
      { word: "vardhanam", meaning: "increasing" },
      { word: "prati-padam", meaning: "at every step" },
      { word: "pūrṇa-amṛta", meaning: "of complete nectar" },
      { word: "āsvādanam", meaning: "tasting" },
      { word: "sarva-ātma", meaning: "of the whole self" },
      { word: "snapanam", meaning: "bathing" },
      { word: "param", meaning: "the supreme" },
      { word: "vijayate", meaning: "is victorious" },
      { word: "śrī-kṛṣṇa-saṅkīrtanam", meaning: "the chanting of the holy name of Krsna" },
    ],
  },
  {
    id: "pranama_prabhupada",
    title: "Prabhupāda Praṇāma Mantra",
    source: "Prayers",
    category: "Prayers",
    devanagari: [
      "नमोम्भुज-लोचन पाद-युगल",
      "श्री-मद् अभय-चरणारविन्द भक्तिवेदान्त स्वामिन्",
      "इति नाम-सुधाकर।",
    ],
    transliteration: [
      "nama oṁ viṣṇu-pādāya",
      "kṛṣṇa-preṣṭhāya bhū-tale",
      "śrīmate bhaktivedānta-",
      "svāmin iti nāmine",
      "namas te sārasvate deve",
      "gaura-vāṇī-pracāriṇe",
      "nirviśeṣa-śūnyavādi-",
      "pāścātya-deśa-tāriṇe",
    ],
    translation:
      "I offer my respectful obeisances unto His Divine Grace A.C. Bhaktivedanta Swami Prabhupāda, who is very dear to Lord Kṛṣṇa, having taken shelter at His lotus feet. Our respectful obeisances are unto you, O spiritual master, servant of Bhaktisiddhānta Sarasvatī Gosvāmī. You are kindly preaching the message of Lord Caitanyadeva and delivering the Western countries, which are filled with impersonalism and voidism.",
    word_by_word: [
      { word: "namaḥ", meaning: "I offer my respectful obeisances" },
      { word: "om", meaning: "O my Lord" },
      { word: "viṣṇu-pādāya", meaning: "unto him who has taken shelter of the lotus feet of Lord Viṣṇu" },
      { word: "kṛṣṇa-preṣṭhāya", meaning: "who is very dear to Lord Kṛṣṇa" },
      { word: "bhū-tale", meaning: "on the earth" },
      { word: "śrīmate", meaning: "in the glory" },
      { word: "bhaktivedānta", meaning: "Bhaktivedanta" },
      { word: "svāmin", meaning: "O master" },
      { word: "iti", meaning: "thus" },
      { word: "nāmine", meaning: "one whose name" },
      { word: "namas te", meaning: "I offer my obeisances unto you" },
      { word: "sārasvate deve", meaning: "O devotee of Sarasvatī" },
      { word: "gaura-vāṇī", meaning: "the message of Lord Caitanya" },
      { word: "pracāriṇe", meaning: "who is engaged in distributing" },
    ],
  },
  {
    id: "bg_2_47",
    title: "Bhagavad Gita 2.47",
    source: "Bhagavad Gita As It Is",
    category: "Bhagavad Gita",
    devanagari: [
      "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।",
      "मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥",
    ],
    transliteration: [
      "karmaṇy evādhikāras te",
      "mā phaleṣu kadācana",
      "mā karma-phala-hetur bhūr",
      "mā te saṅgo 'stv akarmaṇi",
    ],
    translation:
      "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.",
    word_by_word: [
      { word: "karmaṇi", meaning: "in prescribed duties" },
      { word: "eva", meaning: "certainly" },
      { word: "adhikāraḥ", meaning: "right" },
      { word: "te", meaning: "of you" },
      { word: "mā", meaning: "never" },
      { word: "phaleṣu", meaning: "in the fruits" },
      { word: "kadācana", meaning: "at any time" },
      { word: "mā", meaning: "never" },
      { word: "karma-phala", meaning: "in the result of the work" },
      { word: "hetuḥ", meaning: "cause" },
      { word: "bhūḥ", meaning: "become" },
      { word: "mā", meaning: "never" },
      { word: "te", meaning: "of you" },
      { word: "saṅgaḥ", meaning: "attachment" },
      { word: "astu", meaning: "there should be" },
      { word: "akarmaṇi", meaning: "in not doing prescribed duties" },
    ],
  },
];

export const categories = [...new Set(slokas.map((s) => s.category))];
