export interface Subject {
  id: number
  name: string
  icon: string
  isPreset: boolean
  userId?: string
}

export interface Word {
  id: number
  subjectId: number
  english: string
  chinese: string
  pronunciation: string
  phonetic: string
  definition: string
  exampleSentence: string
  example: string
  exampleTranslation: string
  root: string
  rootMeaning: string
}

export interface WordProgress {
  userId: string
  wordId: number
  status: 'known' | 'unknown'
  reviewCount: number
  lastReviewedAt: string
  nextReviewAt: string
}

export interface UserRecord {
  id: string
  email: string
  passwordHash: string
}

// ============ localStorage helpers ============

function readStore<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeStore<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function getUsers(): UserRecord[] {
  return readStore<UserRecord>('medterm_users')
}

function getSubjects(): Subject[] {
  return readStore<Subject>('medterm_subjects')
}

function getWords(): (Omit<Word, 'phonetic' | 'example'> & { phonetic?: string; example?: string })[] {
  return readStore<Omit<Word, 'phonetic' | 'example'> & { phonetic?: string; example?: string }>('medterm_words')
}

function getProgress(): WordProgress[] {
  return readStore<WordProgress>('medterm_progress')
}

function getUserSubjects(): { userId: string; subjectId: number }[] {
  return readStore<{ userId: string; subjectId: number }>('medterm_userSubjects')
}

// ============ Password hashing ============

function hashPassword(password: string): string {
  return btoa(password + 'medterm-salt')
}

// ============ Preset data ============

const PRESET_SUBJECTS = [
  { id: 1, name: '系统解剖学', icon: '🦴', isPreset: true },
  { id: 2, name: '有机化学', icon: '⚗️', isPreset: true },
  { id: 3, name: '生物化学', icon: '🧬', isPreset: true },
  { id: 4, name: '病理学', icon: '🔬', isPreset: true },
  { id: 5, name: '药理学', icon: '💊', isPreset: true },
]

const PRESET_WORDS = [
  // === 系统解剖学 (subjectId: 1) ===
  { id: 1, subjectId: 1, english: 'skull', chinese: '颅骨', pronunciation: '/skʌl/', definition: '头部的骨骼结构，由多块骨组成，保护大脑', exampleSentence: 'The skull protects the brain from mechanical injury.', exampleTranslation: '颅骨保护大脑免受机械性损伤。', root: 'crani-', rootMeaning: '颅骨' },
  { id: 2, subjectId: 1, english: 'clavicle', chinese: '锁骨', pronunciation: '/ˈklævɪkl/', definition: '连接胸骨与肩胛骨的长骨', exampleSentence: 'Fracture of the clavicle is common in contact sports.', exampleTranslation: '锁骨骨折在接触性运动中很常见。', root: 'clavicul-', rootMeaning: '小钥匙（形似）' },
  { id: 3, subjectId: 1, english: 'sternum', chinese: '胸骨', pronunciation: '/ˈstɜːrnəm/', definition: '位于胸廓前壁正中的扁平骨', exampleSentence: 'The sternum articulates with the clavicles and ribs.', exampleTranslation: '胸骨与锁骨和肋骨相连。', root: 'stern-', rootMeaning: '胸骨' },
  { id: 4, subjectId: 1, english: 'scapula', chinese: '肩胛骨', pronunciation: '/ˈskæpjʊlə/', definition: '位于胸廓后外侧的三角形扁骨', exampleSentence: 'The scapula provides attachment for multiple muscles.', exampleTranslation: '肩胛骨为多块肌肉提供附着点。', root: 'scapul-', rootMeaning: '肩胛' },
  { id: 5, subjectId: 1, english: 'humerus', chinese: '肱骨', pronunciation: '/ˈhjuːmərəs/', definition: '上臂的长骨，连接肩关节和肘关节', exampleSentence: 'The humerus is the longest bone of the upper limb.', exampleTranslation: '肱骨是上肢最长的骨骼。', root: 'humer-', rootMeaning: '上臂' },
  { id: 6, subjectId: 1, english: 'radius', chinese: '桡骨', pronunciation: '/ˈreɪdiəs/', definition: '前臂外侧的长骨，与尺骨平行', exampleSentence: 'The radius rotates around the ulna during pronation.', exampleTranslation: '前臂旋前时桡骨围绕尺骨旋转。', root: 'radi-', rootMeaning: '射线、辐条' },
  { id: 7, subjectId: 1, english: 'ulna', chinese: '尺骨', pronunciation: '/ˈʌlnə/', definition: '前臂内侧的长骨，较桡骨粗大', exampleSentence: 'The ulna forms the major portion of the elbow joint.', exampleTranslation: '尺骨构成肘关节的主要部分。', root: 'uln-', rootMeaning: '肘' },
  { id: 8, subjectId: 1, english: 'femur', chinese: '股骨', pronunciation: '/ˈfiːmər/', definition: '人体最长的骨骼，位于大腿', exampleSentence: 'The femur is the strongest bone in the human body.', exampleTranslation: '股骨是人体最强壮的骨骼。', root: 'femor-', rootMeaning: '大腿' },
  { id: 9, subjectId: 1, english: 'tibia', chinese: '胫骨', pronunciation: '/ˈtɪbiə/', definition: '小腿内侧的粗大长骨，承重的主要骨骼', exampleSentence: 'The tibia bears most of the body weight during standing.', exampleTranslation: '站立时胫骨承受大部分体重。', root: 'tibi-', rootMeaning: '胫骨' },
  { id: 10, subjectId: 1, english: 'fibula', chinese: '腓骨', pronunciation: '/ˈfɪbjʊlə/', definition: '小腿外侧的细长长骨，不直接承重', exampleSentence: 'The fibula provides attachment for muscles but does not bear weight.', exampleTranslation: '腓骨提供肌肉附着点但不承重。', root: 'fibul-', rootMeaning: '扣针' },
  { id: 11, subjectId: 1, english: 'vertebra', chinese: '椎骨', pronunciation: '/ˈvɜːrtɪbrə/', definition: '构成脊柱的单个骨块，复数形式为vertebrae', exampleSentence: 'Each vertebra is separated by an intervertebral disc.', exampleTranslation: '每块椎骨之间由椎间盘隔开。', root: 'vertebr-', rootMeaning: '关节、转向' },
  { id: 12, subjectId: 1, english: 'pelvis', chinese: '骨盆', pronunciation: '/ˈpelvɪs/', definition: '由髋骨、骶骨和尾骨组成的骨性结构', exampleSentence: 'The pelvis supports the weight of the upper body when sitting.', exampleTranslation: '坐位时骨盆支撑上半身的重量。', root: 'pelv-', rootMeaning: '盆' },
  { id: 13, subjectId: 1, english: 'costa', chinese: '肋骨', pronunciation: '/ˈkɒstə/', definition: '构成胸廓的弧形扁骨，共12对', exampleSentence: 'The costae protect the heart and lungs from trauma.', exampleTranslation: '肋骨保护心脏和肺免受创伤。', root: 'cost-', rootMeaning: '肋骨' },
  { id: 14, subjectId: 1, english: 'mandible', chinese: '下颌骨', pronunciation: '/ˈmændɪbl/', definition: '面部唯一可活动的骨骼，构成下颌', exampleSentence: 'The mandible is the only movable bone of the skull.', exampleTranslation: '下颌骨是颅骨中唯一可活动的骨骼。', root: 'mandibul-', rootMeaning: '下颌' },
  { id: 15, subjectId: 1, english: 'patella', chinese: '髌骨', pronunciation: '/pəˈtelə/', definition: '位于膝关节前方的籽骨，俗称膝盖骨', exampleSentence: 'The patella improves the mechanical advantage of the quadriceps muscle.', exampleTranslation: '髌骨提高了股四头肌的力学优势。', root: 'patell-', rootMeaning: '小盘' },
  { id: 16, subjectId: 1, english: 'phalanx', chinese: '指骨/趾骨', pronunciation: '/ˈfeɪlæŋks/', definition: '手指和脚趾的骨骼，复数形式为phalanges', exampleSentence: 'The phalanges are the bones that make up the fingers and toes.', exampleTranslation: '指骨是构成手指和脚趾的骨骼。', root: 'phalang-', rootMeaning: '方阵、指节' },
  { id: 17, subjectId: 1, english: 'sacrum', chinese: '骶骨', pronunciation: '/ˈseɪkrəm/', definition: '由5块骶椎融合而成的三角形骨', exampleSentence: 'The sacrum connects the spine to the pelvis.', exampleTranslation: '骶骨将脊柱连接到骨盆。', root: 'sacr-', rootMeaning: '神圣的' },
  { id: 18, subjectId: 1, english: 'coccyx', chinese: '尾骨', pronunciation: '/ˈkɒksɪks/', definition: '由3-5块尾椎融合而成的小骨', exampleSentence: 'The coccyx is the remnant of a vestigial tail.', exampleTranslation: '尾骨是退化尾巴的残余。', root: 'coccyg-', rootMeaning: '布谷鸟（形似鸟喙）' },

  // === 有机化学 (subjectId: 2) ===
  { id: 19, subjectId: 2, english: 'alkane', chinese: '烷烃', pronunciation: '/ˈælkeɪn/', definition: '饱和碳氢化合物，通式为CnH₂n₊₂', exampleSentence: 'Methane is the simplest alkane with the formula CH₄.', exampleTranslation: '甲烷是最简单的烷烃，分子式为CH₄。', root: 'alk-', rootMeaning: '烷基' },
  { id: 20, subjectId: 2, english: 'alkene', chinese: '烯烃', pronunciation: '/ˈælkiːn/', definition: '含有碳碳双键的不饱和烃，通式为CnH₂n', exampleSentence: 'Ethene is the simplest alkene used in polymer production.', exampleTranslation: '乙烯是最简单的烯烃，用于聚合物生产。', root: 'alk- + -ene', rootMeaning: '烷基+烯' },
  { id: 21, subjectId: 2, english: 'alkyne', chinese: '炔烃', pronunciation: '/ˈælkaɪn/', definition: '含有碳碳三键的不饱和烃，通式为CnH₂n₋₂', exampleSentence: 'Acetylene is the simplest alkyne used in welding torches.', exampleTranslation: '乙炔是最简单的炔烃，用于焊接火炬。', root: 'alk- + -yne', rootMeaning: '烷基+炔' },
  { id: 22, subjectId: 2, english: 'benzene', chinese: '苯', pronunciation: '/ˈbenziːn/', definition: '最简单的芳香烃，分子式为C₆H₆', exampleSentence: 'Benzene is a carcinogenic aromatic hydrocarbon.', exampleTranslation: '苯是一种致癌的芳香烃。', root: 'benz-', rootMeaning: '苯' },
  { id: 23, subjectId: 2, english: 'phenol', chinese: '苯酚', pronunciation: '/ˈfiːnɒl/', definition: '羟基直接连接在苯环上的化合物', exampleSentence: 'Phenol is used as a disinfectant in medical settings.', exampleTranslation: '苯酚在医疗环境中用作消毒剂。', root: 'phen-', rootMeaning: '苯基' },
  { id: 24, subjectId: 2, english: 'aldehyde', chinese: '醛', pronunciation: '/ˈældɪhaɪd/', definition: '含有醛基（-CHO）的有机化合物', exampleSentence: 'Formaldehyde is the simplest aldehyde used as a preservative.', exampleTranslation: '甲醛是最简单的醛，用作防腐剂。', root: 'aldehyd-', rootMeaning: '醇脱氢' },
  { id: 25, subjectId: 2, english: 'ketone', chinese: '酮', pronunciation: '/ˈkiːtəʊn/', definition: '含有羰基（C=O）连接两个碳原子的化合物', exampleSentence: 'Acetone is the simplest ketone commonly used as a solvent.', exampleTranslation: '丙酮是最简单的酮，常用作溶剂。', root: 'ket-', rootMeaning: '酮' },
  { id: 26, subjectId: 2, english: 'carboxylic acid', chinese: '羧酸', pronunciation: '/ˌkɑːrbɒkˈsɪlɪk ˈæsɪd/', definition: '含有羧基（-COOH）的有机酸', exampleSentence: 'Acetic acid is a carboxylic acid found in vinegar.', exampleTranslation: '乙酸是醋中含有的羧酸。', root: 'carboxyl-', rootMeaning: '羰基+羟基' },
  { id: 27, subjectId: 2, english: 'ester', chinese: '酯', pronunciation: '/ˈestər/', definition: '由羧酸和醇反应生成的化合物', exampleSentence: 'Esters are responsible for the fragrance of many fruits.', exampleTranslation: '酯类物质赋予许多水果香味。', root: 'ester-', rootMeaning: '酯' },
  { id: 28, subjectId: 2, english: 'amine', chinese: '胺', pronunciation: '/əˈmiːn/', definition: '含有氨基（-NH₂）的有机化合物', exampleSentence: 'Amines are important building blocks in pharmaceutical synthesis.', exampleTranslation: '胺是药物合成中的重要构建模块。', root: 'amin-', rootMeaning: '氨' },
  { id: 29, subjectId: 2, english: 'amide', chinese: '酰胺', pronunciation: '/ˈæmaɪd/', definition: '含有酰胺基（-CONH₂）的化合物', exampleSentence: 'Proteins are polymers of amino acids linked by amide bonds.', exampleTranslation: '蛋白质是由酰胺键连接的氨基酸聚合物。', root: 'amid-', rootMeaning: '酰胺' },
  { id: 30, subjectId: 2, english: 'isomer', chinese: '异构体', pronunciation: '/ˈaɪsəmər/', definition: '分子式相同但结构不同的化合物', exampleSentence: 'Glucose and fructose are structural isomers.', exampleTranslation: '葡萄糖和果糖是结构异构体。', root: 'iso- + -mer', rootMeaning: '相同+部分' },
  { id: 31, subjectId: 2, english: 'polymer', chinese: '聚合物', pronunciation: '/ˈpɒlɪmər/', definition: '由重复单体单元组成的大分子化合物', exampleSentence: 'Polyethylene is the most widely used synthetic polymer.', exampleTranslation: '聚乙烯是使用最广泛的合成聚合物。', root: 'poly- + -mer', rootMeaning: '多+部分' },
  { id: 32, subjectId: 2, english: 'catalyst', chinese: '催化剂', pronunciation: '/ˈkætəlɪst/', definition: '加速化学反应而自身不被消耗的物质', exampleSentence: 'Enzymes are biological catalysts that accelerate metabolic reactions.', exampleTranslation: '酶是加速代谢反应的生物催化剂。', root: 'cataly-', rootMeaning: '分解' },
  { id: 33, subjectId: 2, english: 'nucleophile', chinese: '亲核试剂', pronunciation: '/ˈnjuːkliəfaɪl/', definition: '富电子物种，倾向于攻击缺电子中心', exampleSentence: 'The hydroxide ion is a strong nucleophile in substitution reactions.', exampleTranslation: '氢氧根离子是取代反应中的强亲核试剂。', root: 'nucleo- + -phile', rootMeaning: '核+亲和' },
  { id: 34, subjectId: 2, english: 'electrophile', chinese: '亲电试剂', pronunciation: '/ɪˈlektrəfaɪl/', definition: '缺电子物种，倾向于接受电子对', exampleSentence: 'The carbocation is a reactive electrophile in organic reactions.', exampleTranslation: '碳正离子是有机反应中的活泼亲电试剂。', root: 'electro- + -phile', rootMeaning: '电子+亲和' },
  { id: 35, subjectId: 2, english: 'enantiomer', chinese: '对映异构体', pronunciation: '/ɪˈnæntiəmər/', definition: '互为镜像但不能重叠的立体异构体', exampleSentence: 'Many drugs exist as enantiomers with different biological activities.', exampleTranslation: '许多药物以对映异构体形式存在，具有不同的生物活性。', root: 'enantio- + -mer', rootMeaning: '相反+部分' },
  { id: 36, subjectId: 2, english: 'chiral', chinese: '手性', pronunciation: '/ˈkaɪrəl/', definition: '分子与其镜像不能重叠的性质', exampleSentence: 'Chiral molecules rotate plane-polarized light in opposite directions.', exampleTranslation: '手性分子使平面偏振光向相反方向旋转。', root: 'chir-', rootMeaning: '手' },

  // === 生物化学 (subjectId: 3) ===
  { id: 37, subjectId: 3, english: 'enzyme', chinese: '酶', pronunciation: '/ˈenzaɪm/', definition: '生物催化剂，加速体内化学反应', exampleSentence: 'Hexokinase is the enzyme that catalyzes the first step of glycolysis.', exampleTranslation: '己糖激酶是催化糖酵解第一步的酶。', root: 'en- + zym-', rootMeaning: '在…中+发酵' },
  { id: 38, subjectId: 3, english: 'substrate', chinese: '底物', pronunciation: '/ˈsʌbstreɪt/', definition: '酶催化反应中的作用物', exampleSentence: 'The substrate binds to the active site of the enzyme.', exampleTranslation: '底物与酶的活性位点结合。', root: 'sub- + strat-', rootMeaning: '下面+层' },
  { id: 39, subjectId: 3, english: 'glycolysis', chinese: '糖酵解', pronunciation: '/ɡlaɪˈkɒlɪsɪs/', definition: '将葡萄糖分解为丙酮酸并产生ATP的代谢途径', exampleSentence: 'Glycolysis occurs in the cytoplasm and does not require oxygen.', exampleTranslation: '糖酵解发生在细胞质中，不需要氧气。', root: 'glyco- + -lysis', rootMeaning: '糖+分解' },
  { id: 40, subjectId: 3, english: 'gluconeogenesis', chinese: '糖异生', pronunciation: '/ˌɡluːkəˌniːəˈdʒenɪsɪs/', definition: '从非糖前体合成葡萄糖的代谢途径', exampleSentence: 'Gluconeogenesis occurs primarily in the liver during fasting.', exampleTranslation: '空腹时糖异生主要发生在肝脏。', root: 'gluco- + neo- + -genesis', rootMeaning: '糖+新+生成' },
  { id: 41, subjectId: 3, english: 'ATP', chinese: '三磷酸腺苷', pronunciation: '/ˌeɪtiːˈpiː/', definition: '细胞的主要能量货币', exampleSentence: 'ATP hydrolysis releases energy for cellular processes.', exampleTranslation: 'ATP水解释放能量供细胞过程使用。', root: 'adenosin- + tri- + phosphat-', rootMeaning: '腺苷+三+磷酸' },
  { id: 42, subjectId: 3, english: 'mitochondria', chinese: '线粒体', pronunciation: '/ˌmaɪtəˈkɒndriən/', definition: '细胞的能量工厂，进行氧化磷酸化', exampleSentence: 'Mitochondria contain their own DNA and ribosomes.', exampleTranslation: '线粒体含有自身的DNA和核糖体。', root: 'mito- + chondr-', rootMeaning: '线+颗粒' },
  { id: 43, subjectId: 3, english: 'ribosome', chinese: '核糖体', pronunciation: '/ˈraɪbəsəʊm/', definition: '蛋白质合成的分子机器', exampleSentence: 'Ribosomes translate mRNA into polypeptide chains.', exampleTranslation: '核糖体将mRNA翻译为多肽链。', root: 'ribo- + -some', rootMeaning: '核糖+体' },
  { id: 44, subjectId: 3, english: 'transcription', chinese: '转录', pronunciation: '/trænˈskrɪpʃən/', definition: '以DNA为模板合成RNA的过程', exampleSentence: 'Transcription is catalyzed by RNA polymerase in the nucleus.', exampleTranslation: '转录由细胞核中的RNA聚合酶催化。', root: 'trans- + scrip-', rootMeaning: '跨越+写' },
  { id: 45, subjectId: 3, english: 'translation', chinese: '翻译', pronunciation: '/trænsˈleɪʃən/', definition: '以mRNA为模板合成蛋白质的过程', exampleSentence: 'Translation occurs on ribosomes in the cytoplasm.', exampleTranslation: '翻译在细胞质中的核糖体上进行。', root: 'trans- + lat-', rootMeaning: '跨越+携带' },
  { id: 46, subjectId: 3, english: 'replication', chinese: '复制', pronunciation: '/ˌreplɪˈkeɪʃən/', definition: 'DNA分子自我复制的过程', exampleSentence: 'DNA replication is semiconservative and bidirectional.', exampleTranslation: 'DNA复制是半保留和双向的。', root: 're- + plic-', rootMeaning: '再次+折叠' },
  { id: 47, subjectId: 3, english: 'codon', chinese: '密码子', pronunciation: '/ˈkəʊdɒn/', definition: 'mRNA上三个相邻核苷酸组成的编码单元', exampleSentence: 'Each codon specifies a particular amino acid or a stop signal.', exampleTranslation: '每个密码子指定一个特定的氨基酸或终止信号。', root: 'cod-', rootMeaning: '编码' },
  { id: 48, subjectId: 3, english: 'anticodon', chinese: '反密码子', pronunciation: '/ˌæntiˈkəʊdɒn/', definition: 'tRNA上与mRNA密码子互补的三核苷酸序列', exampleSentence: 'The anticodon of tRNA pairs with the complementary codon on mRNA.', exampleTranslation: 'tRNA的反密码子与mRNA上的互补密码子配对。', root: 'anti- + codon', rootMeaning: '反+密码子' },
  { id: 49, subjectId: 3, english: 'peptide', chinese: '肽', pronunciation: '/ˈpeptaɪd/', definition: '由氨基酸通过肽键连接而成的短链', exampleSentence: 'Peptide bonds link amino acids together in proteins.', exampleTranslation: '肽键将氨基酸连接成蛋白质。', root: 'pept-', rootMeaning: '消化' },
  { id: 50, subjectId: 3, english: 'lipid', chinese: '脂质', pronunciation: '/ˈlɪpɪd/', definition: '不溶于水的生物分子，包括脂肪和磷脂', exampleSentence: 'Lipids form the bilayer structure of cell membranes.', exampleTranslation: '脂质形成细胞膜的双层结构。', root: 'lip-', rootMeaning: '脂肪' },
  { id: 51, subjectId: 3, english: 'carbohydrate', chinese: '碳水化合物', pronunciation: '/ˌkɑːbəˈhaɪdreɪt/', definition: '由碳、氢、氧组成的生物分子，主要能量来源', exampleSentence: 'Carbohydrates are the primary source of energy for the brain.', exampleTranslation: '碳水化合物是大脑的主要能量来源。', root: 'carbo- + hydr-', rootMeaning: '碳+水' },
  { id: 52, subjectId: 3, english: 'nucleotide', chinese: '核苷酸', pronunciation: '/ˈnjuːkliətaɪd/', definition: '核酸的基本结构单元', exampleSentence: 'Each nucleotide consists of a sugar, a phosphate, and a base.', exampleTranslation: '每个核苷酸由一个糖、一个磷酸和一个碱基组成。', root: 'nucleo- + -tide', rootMeaning: '核+酸' },
  { id: 53, subjectId: 3, english: 'metabolism', chinese: '新陈代谢', pronunciation: '/mɪˈtæbəlɪzəm/', definition: '生物体内所有化学反应的总称', exampleSentence: 'Metabolism includes both catabolic and anabolic pathways.', exampleTranslation: '新陈代谢包括分解代谢和合成代谢途径。', root: 'meta- + bol-', rootMeaning: '变化+投掷' },
  { id: 54, subjectId: 3, english: 'apoptosis', chinese: '细胞凋亡', pronunciation: '/ˌæpəˈtəʊsɪs/', definition: '程序性细胞死亡，维持组织稳态', exampleSentence: 'Apoptosis is a regulated process that eliminates damaged cells.', exampleTranslation: '细胞凋亡是清除受损细胞的调控过程。', root: 'apo- + ptosis', rootMeaning: '离开+落下' },

  // === 病理学 (subjectId: 4) ===
  { id: 55, subjectId: 4, english: 'inflammation', chinese: '炎症', pronunciation: '/ˌɪnfləˈmeɪʃən/', definition: '机体对损伤因子的防御反应', exampleSentence: 'Acute inflammation is characterized by redness, swelling, heat, and pain.', exampleTranslation: '急性炎症以红、肿、热、痛为特征。', root: 'inflamm-', rootMeaning: '着火' },
  { id: 56, subjectId: 4, english: 'necrosis', chinese: '坏死', pronunciation: '/nɪˈkrəʊsɪs/', definition: '细胞或组织的非程序性死亡', exampleSentence: 'Coagulative necrosis is commonly seen in ischemic injury.', exampleTranslation: '凝固性坏死常见于缺血性损伤。', root: 'necr- + -osis', rootMeaning: '死亡+状态' },
  { id: 57, subjectId: 4, english: 'hyperplasia', chinese: '增生', pronunciation: '/ˌhaɪpəˈpleɪʒə/', definition: '细胞数量增加导致的组织增大', exampleSentence: 'Benign prostatic hyperplasia is common in elderly men.', exampleTranslation: '良性前列腺增生在老年男性中很常见。', root: 'hyper- + -plasia', rootMeaning: '过度+形成' },
  { id: 58, subjectId: 4, english: 'hypertrophy', chinese: '肥大', pronunciation: '/haɪˈpɜːtrəfi/', definition: '细胞体积增大导致的组织增大', exampleSentence: 'Cardiac hypertrophy occurs in response to chronic hypertension.', exampleTranslation: '心脏肥大是对慢性高血压的反应。', root: 'hyper- + -trophy', rootMeaning: '过度+营养' },
  { id: 59, subjectId: 4, english: 'atrophy', chinese: '萎缩', pronunciation: '/ˈætrəfi/', definition: '细胞体积缩小或数量减少导致的组织缩小', exampleSentence: 'Muscle atrophy occurs after prolonged immobilization.', exampleTranslation: '长期固定后会发生肌肉萎缩。', root: 'a- + -trophy', rootMeaning: '无+营养' },
  { id: 60, subjectId: 4, english: 'metaplasia', chinese: '化生', pronunciation: '/ˌmetəˈpleɪʒə/', definition: '一种分化成熟的细胞被另一种替代', exampleSentence: 'Barrett esophagus involves intestinal metaplasia of the esophageal epithelium.', exampleTranslation: 'Barrett食管涉及食管上皮的肠化生。', root: 'meta- + -plasia', rootMeaning: '变化+形成' },
  { id: 61, subjectId: 4, english: 'dysplasia', chinese: '异型增生', pronunciation: '/dɪsˈpleɪʒə/', definition: '细胞形态和排列的异常改变', exampleSentence: 'Cervical dysplasia is a precancerous condition detected by Pap smear.', exampleTranslation: '宫颈异型增生是一种通过巴氏涂片检测的癌前状态。', root: 'dys- + -plasia', rootMeaning: '异常+形成' },
  { id: 62, subjectId: 4, english: 'carcinoma', chinese: '癌', pronunciation: '/ˌkɑːrsɪˈnəʊmə/', definition: '来源于上皮组织的恶性肿瘤', exampleSentence: 'Squamous cell carcinoma arises from the squamous epithelium.', exampleTranslation: '鳞状细胞癌来源于鳞状上皮。', root: 'carcin- + -oma', rootMeaning: '螃蟹+肿瘤' },
  { id: 63, subjectId: 4, english: 'sarcoma', chinese: '肉瘤', pronunciation: '/sɑːrˈkəʊmə/', definition: '来源于间叶组织的恶性肿瘤', exampleSentence: 'Osteosarcoma is the most common primary bone sarcoma.', exampleTranslation: '骨肉瘤是最常见的原发性骨肉瘤。', root: 'sarc- + -oma', rootMeaning: '肉+肿瘤' },
  { id: 64, subjectId: 4, english: 'lymphoma', chinese: '淋巴瘤', pronunciation: '/lɪmˈfəʊmə/', definition: '来源于淋巴组织的恶性肿瘤', exampleSentence: 'Hodgkin lymphoma is characterized by Reed-Sternberg cells.', exampleTranslation: '霍奇金淋巴瘤以Reed-Sternberg细胞为特征。', root: 'lymph- + -oma', rootMeaning: '淋巴+肿瘤' },
  { id: 65, subjectId: 4, english: 'leukemia', chinese: '白血病', pronunciation: '/luːˈkiːmiə/', definition: '造血系统的恶性肿瘤', exampleSentence: 'Acute lymphoblastic leukemia is the most common childhood cancer.', exampleTranslation: '急性淋巴细胞白血病是最常见的儿童癌症。', root: 'leuk- + -emia', rootMeaning: '白色+血液' },
  { id: 66, subjectId: 4, english: 'metastasis', chinese: '转移', pronunciation: '/mɪˈtæstəsɪs/', definition: '癌细胞从原发部位扩散到远处器官', exampleSentence: 'Liver metastasis is a common complication of colorectal cancer.', exampleTranslation: '肝转移是结直肠癌的常见并发症。', root: 'meta- + stasis', rootMeaning: '变化+站立' },
  { id: 67, subjectId: 4, english: 'angiogenesis', chinese: '血管生成', pronunciation: '/ˌændʒiəˈdʒenɪsɪs/', definition: '从已有血管形成新血管的过程', exampleSentence: 'Tumor angiogenesis is essential for cancer growth beyond 2 mm.', exampleTranslation: '肿瘤血管生成对超过2毫米的癌症生长至关重要。', root: 'angio- + -genesis', rootMeaning: '血管+生成' },
  { id: 68, subjectId: 4, english: 'ischemia', chinese: '缺血', pronunciation: '/ɪˈskiːmiə/', definition: '组织血液供应不足', exampleSentence: 'Myocardial ischemia results from coronary artery obstruction.', exampleTranslation: '心肌缺血由冠状动脉阻塞引起。', root: 'isch- + -emia', rootMeaning: '抑制+血液' },
  { id: 69, subjectId: 4, english: 'infarction', chinese: '梗死', pronunciation: '/ɪnˈfɑːrkʃən/', definition: '因缺血导致的组织坏死', exampleSentence: 'Myocardial infarction requires immediate reperfusion therapy.', exampleTranslation: '心肌梗死需要立即再灌注治疗。', root: 'infarct-', rootMeaning: '填塞' },
  { id: 70, subjectId: 4, english: 'thrombosis', chinese: '血栓形成', pronunciation: '/θrɒmˈbəʊsɪs/', definition: '血管内异常血凝块形成', exampleSentence: 'Deep vein thrombosis can lead to pulmonary embolism.', exampleTranslation: '深静脉血栓形成可导致肺栓塞。', root: 'thromb- + -osis', rootMeaning: '凝块+状态' },
  { id: 71, subjectId: 4, english: 'edema', chinese: '水肿', pronunciation: '/ɪˈdiːmə/', definition: '组织间隙积液过多', exampleSentence: 'Pulmonary edema is a life-threatening condition requiring urgent treatment.', exampleTranslation: '肺水肿是一种需要紧急治疗的危及生命的状况。', root: 'edem-', rootMeaning: '肿胀' },

  // === 药理学 (subjectId: 5) ===
  { id: 72, subjectId: 5, english: 'agonist', chinese: '激动剂', pronunciation: '/ˈæɡənɪst/', definition: '与受体结合并产生生物学效应的药物', exampleSentence: 'Morphine is a potent agonist at mu-opioid receptors.', exampleTranslation: '吗啡是μ-阿片受体的强效激动剂。', root: 'agon-', rootMeaning: '竞争、斗争' },
  { id: 73, subjectId: 5, english: 'antagonist', chinese: '拮抗剂', pronunciation: '/ænˈtæɡənɪst/', definition: '与受体结合但不产生效应的药物，阻断激动剂作用', exampleSentence: 'Naloxone is an opioid antagonist used to reverse overdose.', exampleTranslation: '纳洛酮是一种阿片类拮抗剂，用于逆转药物过量。', root: 'ant- + agon-', rootMeaning: '对抗+竞争' },
  { id: 74, subjectId: 5, english: 'pharmacokinetics', chinese: '药代动力学', pronunciation: '/ˌfɑːrməkəʊkɪˈnetɪks/', definition: '研究药物在体内的吸收、分布、代谢和排泄', exampleSentence: 'Pharmacokinetics determines the dosing regimen of a drug.', exampleTranslation: '药代动力学决定了药物的给药方案。', root: 'pharmaco- + kinet-', rootMeaning: '药物+运动' },
  { id: 75, subjectId: 5, english: 'pharmacodynamics', chinese: '药效动力学', pronunciation: '/ˌfɑːrməkəʊdaɪˈnæmɪks/', definition: '研究药物对机体的作用及机制', exampleSentence: 'Pharmacodynamics explains the relationship between drug concentration and effect.', exampleTranslation: '药效动力学解释了药物浓度与效应之间的关系。', root: 'pharmaco- + dynam-', rootMeaning: '药物+力量' },
  { id: 76, subjectId: 5, english: 'bioavailability', chinese: '生物利用度', pronunciation: '/ˌbaɪəʊəˌveɪləˈbɪlɪti/', definition: '药物到达体循环的比例', exampleSentence: 'Oral bioavailability is affected by first-pass hepatic metabolism.', exampleTranslation: '口服生物利用度受肝脏首过代谢影响。', root: 'bio- + avail-', rootMeaning: '生物+可用' },
  { id: 77, subjectId: 5, english: 'half-life', chinese: '半衰期', pronunciation: '/ˈhɑːf laɪf/', definition: '药物血浆浓度降低一半所需的时间', exampleSentence: 'The half-life of a drug determines the dosing frequency.', exampleTranslation: '药物的半衰期决定了给药频率。', root: 'half + life', rootMeaning: '一半+生命' },
  { id: 78, subjectId: 5, english: 'metabolism', chinese: '代谢', pronunciation: '/mɪˈtæbəlɪzəm/', definition: '药物在体内的化学转化过程', exampleSentence: 'Cytochrome P450 enzymes are responsible for drug metabolism.', exampleTranslation: '细胞色素P450酶负责药物代谢。', root: 'meta- + bol-', rootMeaning: '变化+投掷' },
  { id: 79, subjectId: 5, english: 'excretion', chinese: '排泄', pronunciation: '/ɪkˈskriːʃən/', definition: '药物及其代谢产物从体内排出的过程', exampleSentence: 'Renal excretion is the primary route of elimination for many drugs.', exampleTranslation: '肾排泄是许多药物的主要消除途径。', root: 'ex- + cret-', rootMeaning: '出+分离' },
  { id: 80, subjectId: 5, english: 'receptor', chinese: '受体', pronunciation: '/rɪˈseptər/', definition: '与药物结合并介导药理效应的蛋白质', exampleSentence: 'G protein-coupled receptors are the largest family of drug targets.', exampleTranslation: 'G蛋白偶联受体是最大的药物靶点家族。', root: 're- + cept-', rootMeaning: '再次+接收' },
  { id: 81, subjectId: 5, english: 'dose-response', chinese: '剂量-反应关系', pronunciation: '/ˈdəʊs rɪˈspɒns/', definition: '药物剂量与效应强度之间的关系', exampleSentence: 'The dose-response curve is used to determine the therapeutic window.', exampleTranslation: '剂量-反应曲线用于确定治疗窗。', root: 'dose + response', rootMeaning: '剂量+反应' },
  { id: 82, subjectId: 5, english: 'efficacy', chinese: '效能', pronunciation: '/ˈefɪkəsi/', definition: '药物产生最大效应的能力', exampleSentence: 'Efficacy refers to the maximum effect a drug can produce.', exampleTranslation: '效能指药物能产生的最大效应。', root: 'effic-', rootMeaning: '有效' },
  { id: 83, subjectId: 5, english: 'affinity', chinese: '亲和力', pronunciation: '/əˈfɪnɪti/', definition: '药物与受体结合的能力', exampleSentence: 'A drug with high affinity binds tightly to its receptor.', exampleTranslation: '高亲和力的药物与受体结合紧密。', root: 'af- + fin-', rootMeaning: '向+边界' },
  { id: 84, subjectId: 5, english: 'tolerance', chinese: '耐受性', pronunciation: '/ˈtɒlərəns/', definition: '反复用药后药效降低的现象', exampleSentence: 'Chronic opioid use leads to tolerance requiring dose escalation.', exampleTranslation: '长期使用阿片类药物会导致耐受性，需要增加剂量。', root: 'toler-', rootMeaning: '容忍' },
  { id: 85, subjectId: 5, english: 'withdrawal', chinese: '戒断反应', pronunciation: '/wɪðˈdrɔːəl/', definition: '停止用药后出现的不适症状', exampleSentence: 'Alcohol withdrawal can be life-threatening and requires medical supervision.', exampleTranslation: '酒精戒断反应可能危及生命，需要医疗监护。', root: 'with- + draw-', rootMeaning: '向后+拉' },
  { id: 86, subjectId: 5, english: 'placebo', chinese: '安慰剂', pronunciation: '/pləˈsiːbəʊ/', definition: '无药理活性的物质，用于对照试验', exampleSentence: 'The placebo effect demonstrates the power of expectation in treatment.', exampleTranslation: '安慰剂效应证明了期望在治疗中的力量。', root: 'placeb-', rootMeaning: '我将取悦' },
  { id: 87, subjectId: 5, english: 'contraindication', chinese: '禁忌症', pronunciation: '/ˌkɒntrəˌɪndɪˈkeɪʃən/', definition: '不应使用某种药物的情况', exampleSentence: 'Pregnancy is a contraindication for many teratogenic drugs.', exampleTranslation: '妊娠是许多致畸药物的禁忌症。', root: 'contra- + indic-', rootMeaning: '反对+指示' },
  { id: 88, subjectId: 5, english: 'adverse effect', chinese: '不良反应', pronunciation: '/ˈædvɜːrs ɪˈfekt/', definition: '药物治疗中出现的非预期有害反应', exampleSentence: 'Adverse effects must be reported in clinical trials for drug approval.', exampleTranslation: '不良反应必须在临床试验中报告以获得药物批准。', root: 'adverse + effect', rootMeaning: '不利+效应' },
  { id: 89, subjectId: 5, english: 'therapeutic index', chinese: '治疗指数', pronunciation: '/ˌθerəˈpjuːtɪk ˈɪndeks/', definition: '药物安全性的衡量指标，TD50/ED50', exampleSentence: 'A narrow therapeutic index requires careful monitoring of drug levels.', exampleTranslation: '狭窄的治疗指数需要仔细监测药物浓度。', root: 'therapeut- + index', rootMeaning: '治疗+指数' },
]

// ============ Initialization ============

export function initialize(): void {
  if (localStorage.getItem('medterm_initialized')) return

  writeStore('medterm_subjects', PRESET_SUBJECTS as Subject[])
  writeStore('medterm_words', PRESET_WORDS)
  writeStore('medterm_users', [])
  writeStore('medterm_progress', [])
  writeStore('medterm_userSubjects', [])
  localStorage.setItem('medterm_initialized', '1')
}

// ============ Word helpers ============

let _nextWordId: number | null = null

function getNextWordId(): number {
  if (_nextWordId === null) {
    const words = getWords()
    _nextWordId = words.length > 0 ? Math.max(...words.map(w => w.id)) + 1 : 90
  }
  return _nextWordId++
}

function toWord(raw: Omit<Word, 'phonetic' | 'example'> & { phonetic?: string; example?: string }): Word {
  return {
    ...raw,
    phonetic: raw.phonetic || raw.pronunciation,
    example: raw.example || raw.exampleSentence,
  } as Word
}

// ============ Auth functions ============

export function registerUser(email: string, password: string): { success: boolean; user?: { id: string; email: string }; error?: string } {
  initialize()
  const users = getUsers()
  if (users.find(u => u.email === email)) {
    return { success: false, error: '邮箱已注册' }
  }
  const newUser: UserRecord = {
    id: crypto.randomUUID(),
    email,
    passwordHash: hashPassword(password),
  }
  users.push(newUser)
  writeStore('medterm_users', users)
  return { success: true, user: { id: newUser.id, email: newUser.email } }
}

export function loginUser(email: string, password: string): { success: boolean; user?: { id: string; email: string }; error?: string } {
  initialize()
  const users = getUsers()
  const user = users.find(u => u.email === email)
  if (!user) {
    return { success: false, error: '邮箱或密码错误' }
  }
  if (user.passwordHash !== hashPassword(password)) {
    return { success: false, error: '邮箱或密码错误' }
  }
  return { success: true, user: { id: user.id, email: user.email } }
}

// ============ Subject functions ============

export function getSubjectsForUser(_userId: string): Subject[] {
  initialize()
  return getSubjects()
}

export function addSubject(_userId: string, name: string, icon: string): Subject {
  initialize()
  const subjects = getSubjects()
  const newId = subjects.length > 0 ? Math.max(...subjects.map(s => s.id)) + 1 : 6
  const newSubject: Subject = {
    id: newId,
    name,
    icon: icon || '📚',
    isPreset: false,
  }
  subjects.push(newSubject)
  writeStore('medterm_subjects', subjects)
  return newSubject
}

export function deleteSubject(_userId: string, subjectId: number): void {
  initialize()
  // Delete subject
  let subjects = getSubjects()
  subjects = subjects.filter(s => s.id !== subjectId)
  writeStore('medterm_subjects', subjects)

  // Delete associated words
  let words = getWords()
  words = words.filter(w => w.subjectId !== subjectId)
  writeStore('medterm_words', words)

  // Delete associated progress
  let progress = getProgress()
  const wordIds = new Set(words.filter(w => w.subjectId === subjectId).map(w => w.id))
  progress = progress.filter(p => !wordIds.has(p.wordId))
  writeStore('medterm_progress', progress)
}

// ============ Word functions ============

export function getWordsBySubject(subjectId: number): Word[] {
  initialize()
  const words = getWords()
  return words.filter(w => w.subjectId === subjectId).map(toWord)
}

export function addWord(subjectId: number, word: Omit<Word, 'id' | 'subjectId' | 'phonetic' | 'example'>): Word {
  initialize()
  const words = getWords()
  const newId = getNextWordId()
  const newWord = {
    id: newId,
    subjectId,
    english: word.english,
    chinese: word.chinese,
    pronunciation: word.pronunciation || '',
    definition: word.definition || '',
    exampleSentence: word.exampleSentence || '',
    exampleTranslation: word.exampleTranslation || '',
    root: word.root || '',
    rootMeaning: word.rootMeaning || '',
  }
  words.push(newWord)
  writeStore('medterm_words', words)
  return toWord(newWord)
}

export function deleteWord(wordId: number): void {
  initialize()
  let words = getWords()
  words = words.filter(w => w.id !== wordId)
  writeStore('medterm_words', words)

  let progress = getProgress()
  progress = progress.filter(p => p.wordId !== wordId)
  writeStore('medterm_progress', progress)
}

export function getAllWords(): Word[] {
  initialize()
  return getWords().map(toWord)
}

export function searchWords(query: string): (Word & { subjectName: string })[] {
  initialize()
  const words = getWords()
  const subjects = getSubjects()
  const q = query.toLowerCase().trim()
  if (!q) return []

  const matched = words.filter(w =>
    w.english.toLowerCase().includes(q) ||
    w.chinese.includes(q)
  )

  const subjectMap = new Map(subjects.map(s => [s.id, s.name]))

  return matched.map(w => ({
    ...toWord(w),
    subjectName: subjectMap.get(w.subjectId) || '',
  }))
}

// ============ Progress functions ============

export function getProgressForUser(userId: string): {
  totalWords: number
  masteredWords: number
  streak: number
  subjectProgress: { name: string; progress: number; color: string }[]
  dailyStats: { date: string; count: number }[]
  recentActivity: { word: string; subject: string; time: string; type: string }[]
} {
  initialize()
  const words = getWords()
  const subjects = getSubjects()
  const progress = getProgress().filter(p => p.userId === userId)

  const totalWords = words.length
  const masteredWords = progress.filter(p => p.status === 'known').length
  const streak = calculateStreak(userId)

  const subjectColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  const subjectProgress = subjects.map((s, i) => {
    const subjectWords = words.filter(w => w.subjectId === s.id)
    const subjectProgress = progress.filter(p => {
      const word = words.find(w => w.id === p.wordId)
      return word && word.subjectId === s.id
    })
    const mastered = subjectProgress.filter(p => p.status === 'known').length
    const progressVal = subjectWords.length > 0 ? Math.round((mastered / subjectWords.length) * 100) : 0
    return {
      name: s.name,
      progress: progressVal,
      color: subjectColors[i % subjectColors.length],
    }
  })

  // Daily stats for last 90 days
  const dailyStats: { date: string; count: number }[] = []
  const dateMap = new Map<string, number>()
  progress.forEach(p => {
    if (p.lastReviewedAt) {
      const date = p.lastReviewedAt.slice(0, 10)
      dateMap.set(date, (dateMap.get(date) || 0) + 1)
    }
  })
  const today = new Date()
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyStats.push({ date: key, count: dateMap.get(key) || 0 })
  }

  // Recent activity
  const recentActivity = progress
    .filter(p => p.lastReviewedAt)
    .sort((a, b) => new Date(b.lastReviewedAt).getTime() - new Date(a.lastReviewedAt).getTime())
    .slice(0, 10)
    .map(p => {
      const word = words.find(w => w.id === p.wordId)
      const subject = word ? subjects.find(s => s.id === word.subjectId) : null
      const time = p.lastReviewedAt ? new Date(p.lastReviewedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''
      return {
        word: word?.english || '',
        subject: subject?.name || '',
        time,
        type: p.status === 'known' ? '认识' : '不认识',
      }
    })

  return { totalWords, masteredWords, streak, subjectProgress, dailyStats, recentActivity }
}

export function updateProgress(userId: string, wordId: number, status: 'known' | 'unknown'): void {
  initialize()
  const progress = getProgress()
  const existing = progress.find(p => p.userId === userId && p.wordId === wordId)
  const now = new Date().toISOString()

  if (existing) {
    existing.status = status
    existing.reviewCount += 1
    existing.lastReviewedAt = now
    // Set next review: known = 24h, unknown = 1h
    const nextDate = new Date()
    nextDate.setHours(nextDate.getHours() + (status === 'known' ? 24 : 1))
    existing.nextReviewAt = nextDate.toISOString()
  } else {
    const nextDate = new Date()
    nextDate.setHours(nextDate.getHours() + (status === 'known' ? 24 : 1))
    progress.push({
      userId,
      wordId,
      status,
      reviewCount: 1,
      lastReviewedAt: now,
      nextReviewAt: nextDate.toISOString(),
    })
  }
  writeStore('medterm_progress', progress)
}

export function getReviewWords(userId: string): Word[] {
  initialize()
  const words = getWords()
  const progress = getProgress().filter(p => p.userId === userId)
  const now = new Date()

  const dueWordIds = progress
    .filter(p => p.nextReviewAt && new Date(p.nextReviewAt) <= now)
    .map(p => p.wordId)

  // If no due words, return some random words for review
  if (dueWordIds.length === 0) {
    const reviewedIds = new Set(progress.map(p => p.wordId))
    const unreviewed = words.filter(w => !reviewedIds.has(w.id))
    const candidates = unreviewed.length > 0 ? unreviewed : words
    const shuffled = [...candidates].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 5).map(toWord)
  }

  const dueWords = words.filter(w => dueWordIds.includes(w.id))
  const shuffled = [...dueWords].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 10).map(toWord)
}

function calculateStreak(userId: string): number {
  const progress = getProgress().filter(p => p.userId === userId && p.lastReviewedAt)
  if (progress.length === 0) return 0

  const dates = new Set(progress.map(p => p.lastReviewedAt!.slice(0, 10)))
  const sorted = Array.from(dates).sort().reverse()

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const checkDate = new Date(today)
  for (const dateStr of sorted) {
    const expected = checkDate.toISOString().slice(0, 10)
    if (dateStr === expected) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (new Date(dateStr) < checkDate) {
      break
    }
  }

  return streak
}

// Stats helpers for Stats page
export function getSubjectStats(userId: string): { name: string; mastered: number; total: number }[] {
  initialize()
  const words = getWords()
  const subjects = getSubjects()
  const progress = getProgress().filter(p => p.userId === userId)

  return subjects.map(s => {
    const subjectWords = words.filter(w => w.subjectId === s.id)
    const mastered = progress.filter(p => {
      const word = words.find(w => w.id === p.wordId)
      return word && word.subjectId === s.id && p.status === 'known'
    }).length
    return { name: s.name, mastered, total: subjectWords.length }
  })
}

export function getDailyStats(userId: string): { date: string; count: number }[] {
  initialize()
  const progress = getProgress().filter(p => p.userId === userId && p.lastReviewedAt)
  const dateMap = new Map<string, number>()
  progress.forEach(p => {
    const date = p.lastReviewedAt!.slice(0, 10)
    dateMap.set(date, (dateMap.get(date) || 0) + 1)
  })
  const result: { date: string; count: number }[] = []
  const today = new Date()
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push({ date: key, count: dateMap.get(key) || 0 })
  }
  return result
}

export function getOverviewStats(userId: string): {
  total: number
  mastered: number
  rate: number
  trend: { date: string; words: number }[]
} {
  initialize()
  const words = getWords()
  const progress = getProgress().filter(p => p.userId === userId)
  const total = words.length
  const mastered = progress.filter(p => p.status === 'known').length
  const rate = total > 0 ? mastered / total : 0

  const dateMap = new Map<string, number>()
  progress.forEach(p => {
    if (p.lastReviewedAt) {
      const date = p.lastReviewedAt.slice(0, 10)
      dateMap.set(date, (dateMap.get(date) || 0) + 1)
    }
  })
  const trend: { date: string; words: number }[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    trend.push({ date: key, words: dateMap.get(key) || 0 })
  }

  return { total, mastered, rate, trend }
}

// ============ Game helpers ============

export function getGameWords(subjectId: number, count: number): Word[] {
  initialize()
  const words = getWords().filter(w => w.subjectId === subjectId)
  const shuffled = [...words].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map(toWord)
}