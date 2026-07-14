import initSqlJs, { type Database } from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isVercel = !!process.env.VERCEL
const DB_DIR = isVercel ? '/tmp' : path.join(__dirname, 'data')
const DB_PATH = path.join(DB_DIR, 'medterm.db')
const SEED_DB_PATH = path.join(__dirname, 'data', 'medterm.db')

let db: Database | null = null

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function saveDb(): void {
  if (!db) return
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
  }
  const buffer = db.export()
  fs.writeFileSync(DB_PATH, buffer)
}

export async function initDatabase(): Promise<Database> {
  const SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else if (isVercel && fs.existsSync(SEED_DB_PATH)) {
    const buffer = fs.readFileSync(SEED_DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📚',
    is_preset INTEGER DEFAULT 0
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    english TEXT NOT NULL,
    chinese TEXT NOT NULL,
    pronunciation TEXT DEFAULT '',
    definition TEXT DEFAULT '',
    example_sentence TEXT DEFAULT '',
    example_translation TEXT DEFAULT '',
    root TEXT DEFAULT '',
    root_meaning TEXT DEFAULT ''
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS word_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    word_id INTEGER NOT NULL REFERENCES words(id),
    status TEXT DEFAULT 'unknown',
    review_count INTEGER DEFAULT 0,
    last_reviewed_at TEXT,
    next_review_at TEXT,
    UNIQUE(user_id, word_id)
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS user_subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    UNIQUE(user_id, subject_id)
  )`)

  // Insert preset subjects if not exist
  const existingSubjects = db.exec('SELECT COUNT(*) as cnt FROM subjects WHERE is_preset = 1')
  const count = existingSubjects.length > 0 ? existingSubjects[0].values[0][0] as number : 0

  if (count === 0) {
    insertPresetData(db)
  }

  saveDb()
  return db
}

function insertPresetData(db: Database): void {
  // === System Anatomy ===
  db.run(`INSERT INTO subjects (name, icon, is_preset) VALUES ('系统解剖学', '🦴', 1)`)
  const subject1Id = (db.exec('SELECT last_insert_rowid()')![0].values[0][0] as number)

  const anatomyWords = [
    { english: 'skull', chinese: '颅骨', pronunciation: '/skʌl/', definition: '头部的骨骼结构，由多块骨组成，保护大脑', example_sentence: 'The skull protects the brain from mechanical injury.', example_translation: '颅骨保护大脑免受机械性损伤。', root: 'crani-', root_meaning: '颅骨' },
    { english: 'clavicle', chinese: '锁骨', pronunciation: '/ˈklævɪkl/', definition: '连接胸骨与肩胛骨的长骨', example_sentence: 'Fracture of the clavicle is common in contact sports.', example_translation: '锁骨骨折在接触性运动中很常见。', root: 'clavicul-', root_meaning: '小钥匙（形似）' },
    { english: 'sternum', chinese: '胸骨', pronunciation: '/ˈstɜːrnəm/', definition: '位于胸廓前壁正中的扁平骨', example_sentence: 'The sternum articulates with the clavicles and ribs.', example_translation: '胸骨与锁骨和肋骨相连。', root: 'stern-', root_meaning: '胸骨' },
    { english: 'scapula', chinese: '肩胛骨', pronunciation: '/ˈskæpjʊlə/', definition: '位于胸廓后外侧的三角形扁骨', example_sentence: 'The scapula provides attachment for multiple muscles.', example_translation: '肩胛骨为多块肌肉提供附着点。', root: 'scapul-', root_meaning: '肩胛' },
    { english: 'humerus', chinese: '肱骨', pronunciation: '/ˈhjuːmərəs/', definition: '上臂的长骨，连接肩关节和肘关节', example_sentence: 'The humerus is the longest bone of the upper limb.', example_translation: '肱骨是上肢最长的骨骼。', root: 'humer-', root_meaning: '上臂' },
    { english: 'radius', chinese: '桡骨', pronunciation: '/ˈreɪdiəs/', definition: '前臂外侧的长骨，与尺骨平行', example_sentence: 'The radius rotates around the ulna during pronation.', example_translation: '前臂旋前时桡骨围绕尺骨旋转。', root: 'radi-', root_meaning: '射线、辐条' },
    { english: 'ulna', chinese: '尺骨', pronunciation: '/ˈʌlnə/', definition: '前臂内侧的长骨，较桡骨粗大', example_sentence: 'The ulna forms the major portion of the elbow joint.', example_translation: '尺骨构成肘关节的主要部分。', root: 'uln-', root_meaning: '肘' },
    { english: 'femur', chinese: '股骨', pronunciation: '/ˈfiːmər/', definition: '人体最长的骨骼，位于大腿', example_sentence: 'The femur is the strongest bone in the human body.', example_translation: '股骨是人体最强壮的骨骼。', root: 'femor-', root_meaning: '大腿' },
    { english: 'tibia', chinese: '胫骨', pronunciation: '/ˈtɪbiə/', definition: '小腿内侧的粗大长骨，承重的主要骨骼', example_sentence: 'The tibia bears most of the body weight during standing.', example_translation: '站立时胫骨承受大部分体重。', root: 'tibi-', root_meaning: '胫骨' },
    { english: 'fibula', chinese: '腓骨', pronunciation: '/ˈfɪbjʊlə/', definition: '小腿外侧的细长长骨，不直接承重', example_sentence: 'The fibula provides attachment for muscles but does not bear weight.', example_translation: '腓骨提供肌肉附着点但不承重。', root: 'fibul-', root_meaning: '扣针' },
    { english: 'vertebra', chinese: '椎骨', pronunciation: '/ˈvɜːrtɪbrə/', definition: '构成脊柱的单个骨块，复数形式为vertebrae', example_sentence: 'Each vertebra is separated by an intervertebral disc.', example_translation: '每块椎骨之间由椎间盘隔开。', root: 'vertebr-', root_meaning: '关节、转向' },
    { english: 'pelvis', chinese: '骨盆', pronunciation: '/ˈpelvɪs/', definition: '由髋骨、骶骨和尾骨组成的骨性结构', example_sentence: 'The pelvis supports the weight of the upper body when sitting.', example_translation: '坐位时骨盆支撑上半身的重量。', root: 'pelv-', root_meaning: '盆' },
    { english: 'costa', chinese: '肋骨', pronunciation: '/ˈkɒstə/', definition: '构成胸廓的弧形扁骨，共12对', example_sentence: 'The costae protect the heart and lungs from trauma.', example_translation: '肋骨保护心脏和肺免受创伤。', root: 'cost-', root_meaning: '肋骨' },
    { english: 'mandible', chinese: '下颌骨', pronunciation: '/ˈmændɪbl/', definition: '面部唯一可活动的骨骼，构成下颌', example_sentence: 'The mandible is the only movable bone of the skull.', example_translation: '下颌骨是颅骨中唯一可活动的骨骼。', root: 'mandibul-', root_meaning: '下颌' },
    { english: 'patella', chinese: '髌骨', pronunciation: '/pəˈtelə/', definition: '位于膝关节前方的籽骨，俗称膝盖骨', example_sentence: 'The patella improves the mechanical advantage of the quadriceps muscle.', example_translation: '髌骨提高了股四头肌的力学优势。', root: 'patell-', root_meaning: '小盘' },
    { english: 'phalanx', chinese: '指骨/趾骨', pronunciation: '/ˈfeɪlæŋks/', definition: '手指和脚趾的骨骼，复数形式为phalanges', example_sentence: 'The phalanges are the bones that make up the fingers and toes.', example_translation: '指骨是构成手指和脚趾的骨骼。', root: 'phalang-', root_meaning: '方阵、指节' },
    { english: 'sacrum', chinese: '骶骨', pronunciation: '/ˈseɪkrəm/', definition: '由5块骶椎融合而成的三角形骨', example_sentence: 'The sacrum connects the spine to the pelvis.', example_translation: '骶骨将脊柱连接到骨盆。', root: 'sacr-', root_meaning: '神圣的' },
    { english: 'coccyx', chinese: '尾骨', pronunciation: '/ˈkɒksɪks/', definition: '由3-5块尾椎融合而成的小骨', example_sentence: 'The coccyx is the remnant of a vestigial tail.', example_translation: '尾骨是退化尾巴的残余。', root: 'coccyg-', root_meaning: '布谷鸟（形似鸟喙）' },
  ]

  for (const w of anatomyWords) {
    db.run(
      `INSERT INTO words (subject_id, english, chinese, pronunciation, definition, example_sentence, example_translation, root, root_meaning)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [subject1Id, w.english, w.chinese, w.pronunciation, w.definition, w.example_sentence, w.example_translation, w.root, w.root_meaning]
    )
  }

  // === Organic Chemistry ===
  db.run(`INSERT INTO subjects (name, icon, is_preset) VALUES ('有机化学', '⚗️', 1)`)
  const subject2Id = (db.exec('SELECT last_insert_rowid()')![0].values[0][0] as number)

  const chemWords = [
    { english: 'alkane', chinese: '烷烃', pronunciation: '/ˈælkeɪn/', definition: '饱和碳氢化合物，通式为CnH₂n₊₂', example_sentence: 'Methane is the simplest alkane with the formula CH₄.', example_translation: '甲烷是最简单的烷烃，分子式为CH₄。', root: 'alk-', root_meaning: '烷基' },
    { english: 'alkene', chinese: '烯烃', pronunciation: '/ˈælkiːn/', definition: '含有碳碳双键的不饱和烃，通式为CnH₂n', example_sentence: 'Ethene is the simplest alkene used in polymer production.', example_translation: '乙烯是最简单的烯烃，用于聚合物生产。', root: 'alk- + -ene', root_meaning: '烷基+烯' },
    { english: 'alkyne', chinese: '炔烃', pronunciation: '/ˈælkaɪn/', definition: '含有碳碳三键的不饱和烃，通式为CnH₂n₋₂', example_sentence: 'Acetylene is the simplest alkyne used in welding torches.', example_translation: '乙炔是最简单的炔烃，用于焊接火炬。', root: 'alk- + -yne', root_meaning: '烷基+炔' },
    { english: 'benzene', chinese: '苯', pronunciation: '/ˈbenziːn/', definition: '最简单的芳香烃，分子式为C₆H₆', example_sentence: 'Benzene is a carcinogenic aromatic hydrocarbon.', example_translation: '苯是一种致癌的芳香烃。', root: 'benz-', root_meaning: '苯' },
    { english: 'phenol', chinese: '苯酚', pronunciation: '/ˈfiːnɒl/', definition: '羟基直接连接在苯环上的化合物', example_sentence: 'Phenol is used as a disinfectant in medical settings.', example_translation: '苯酚在医疗环境中用作消毒剂。', root: 'phen-', root_meaning: '苯基' },
    { english: 'aldehyde', chinese: '醛', pronunciation: '/ˈældɪhaɪd/', definition: '含有醛基（-CHO）的有机化合物', example_sentence: 'Formaldehyde is the simplest aldehyde used as a preservative.', example_translation: '甲醛是最简单的醛，用作防腐剂。', root: 'aldehyd-', root_meaning: '醇脱氢' },
    { english: 'ketone', chinese: '酮', pronunciation: '/ˈkiːtəʊn/', definition: '含有羰基（C=O）连接两个碳原子的化合物', example_sentence: 'Acetone is the simplest ketone commonly used as a solvent.', example_translation: '丙酮是最简单的酮，常用作溶剂。', root: 'ket-', root_meaning: '酮' },
    { english: 'carboxylic acid', chinese: '羧酸', pronunciation: '/ˌkɑːrbɒkˈsɪlɪk ˈæsɪd/', definition: '含有羧基（-COOH）的有机酸', example_sentence: 'Acetic acid is a carboxylic acid found in vinegar.', example_translation: '乙酸是醋中含有的羧酸。', root: 'carboxyl-', root_meaning: '羰基+羟基' },
    { english: 'ester', chinese: '酯', pronunciation: '/ˈestər/', definition: '由羧酸和醇反应生成的化合物', example_sentence: 'Esters are responsible for the fragrance of many fruits.', example_translation: '酯类物质赋予许多水果香味。', root: 'ester-', root_meaning: '酯' },
    { english: 'amine', chinese: '胺', pronunciation: '/əˈmiːn/', definition: '含有氨基（-NH₂）的有机化合物', example_sentence: 'Amines are important building blocks in pharmaceutical synthesis.', example_translation: '胺是药物合成中的重要构建模块。', root: 'amin-', root_meaning: '氨' },
    { english: 'amide', chinese: '酰胺', pronunciation: '/ˈæmaɪd/', definition: '含有酰胺基（-CONH₂）的化合物', example_sentence: 'Proteins are polymers of amino acids linked by amide bonds.', example_translation: '蛋白质是由酰胺键连接的氨基酸聚合物。', root: 'amid-', root_meaning: '酰胺' },
    { english: 'isomer', chinese: '异构体', pronunciation: '/ˈaɪsəmər/', definition: '分子式相同但结构不同的化合物', example_sentence: 'Glucose and fructose are structural isomers.', example_translation: '葡萄糖和果糖是结构异构体。', root: 'iso- + -mer', root_meaning: '相同+部分' },
    { english: 'polymer', chinese: '聚合物', pronunciation: '/ˈpɒlɪmər/', definition: '由重复单体单元组成的大分子化合物', example_sentence: 'Polyethylene is the most widely used synthetic polymer.', example_translation: '聚乙烯是使用最广泛的合成聚合物。', root: 'poly- + -mer', root_meaning: '多+部分' },
    { english: 'catalyst', chinese: '催化剂', pronunciation: '/ˈkætəlɪst/', definition: '加速化学反应而自身不被消耗的物质', example_sentence: 'Enzymes are biological catalysts that accelerate metabolic reactions.', example_translation: '酶是加速代谢反应的生物催化剂。', root: 'cataly-', root_meaning: '分解' },
    { english: 'nucleophile', chinese: '亲核试剂', pronunciation: '/ˈnjuːkliəfaɪl/', definition: '富电子物种，倾向于攻击缺电子中心', example_sentence: 'The hydroxide ion is a strong nucleophile in substitution reactions.', example_translation: '氢氧根离子是取代反应中的强亲核试剂。', root: 'nucleo- + -phile', root_meaning: '核+亲和' },
    { english: 'electrophile', chinese: '亲电试剂', pronunciation: '/ɪˈlektrəfaɪl/', definition: '缺电子物种，倾向于接受电子对', example_sentence: 'The carbocation is a reactive electrophile in organic reactions.', example_translation: '碳正离子是有机反应中的活泼亲电试剂。', root: 'electro- + -phile', root_meaning: '电子+亲和' },
    { english: 'enantiomer', chinese: '对映异构体', pronunciation: '/ɪˈnæntiəmər/', definition: '互为镜像但不能重叠的立体异构体', example_sentence: 'Many drugs exist as enantiomers with different biological activities.', example_translation: '许多药物以对映异构体形式存在，具有不同的生物活性。', root: 'enantio- + -mer', root_meaning: '相反+部分' },
    { english: 'chiral', chinese: '手性', pronunciation: '/ˈkaɪrəl/', definition: '分子与其镜像不能重叠的性质', example_sentence: 'Chiral molecules rotate plane-polarized light in opposite directions.', example_translation: '手性分子使平面偏振光向相反方向旋转。', root: 'chir-', root_meaning: '手' },
  ]

  for (const w of chemWords) {
    db.run(
      `INSERT INTO words (subject_id, english, chinese, pronunciation, definition, example_sentence, example_translation, root, root_meaning)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [subject2Id, w.english, w.chinese, w.pronunciation, w.definition, w.example_sentence, w.example_translation, w.root, w.root_meaning]
    )
  }

  // === Biochemistry ===
  db.run(`INSERT INTO subjects (name, icon, is_preset) VALUES ('生物化学', '🧬', 1)`)
  const subject3Id = (db.exec('SELECT last_insert_rowid()')![0].values[0][0] as number)

  const biochemWords = [
    { english: 'enzyme', chinese: '酶', pronunciation: '/ˈenzaɪm/', definition: '生物催化剂，加速体内化学反应', example_sentence: 'Hexokinase is the enzyme that catalyzes the first step of glycolysis.', example_translation: '己糖激酶是催化糖酵解第一步的酶。', root: 'en- + zym-', root_meaning: '在…中+发酵' },
    { english: 'substrate', chinese: '底物', pronunciation: '/ˈsʌbstreɪt/', definition: '酶催化反应中的作用物', example_sentence: 'The substrate binds to the active site of the enzyme.', example_translation: '底物与酶的活性位点结合。', root: 'sub- + strat-', root_meaning: '下面+层' },
    { english: 'glycolysis', chinese: '糖酵解', pronunciation: '/ɡlaɪˈkɒlɪsɪs/', definition: '将葡萄糖分解为丙酮酸并产生ATP的代谢途径', example_sentence: 'Glycolysis occurs in the cytoplasm and does not require oxygen.', example_translation: '糖酵解发生在细胞质中，不需要氧气。', root: 'glyco- + -lysis', root_meaning: '糖+分解' },
    { english: 'gluconeogenesis', chinese: '糖异生', pronunciation: '/ˌɡluːkəˌniːəˈdʒenɪsɪs/', definition: '从非糖前体合成葡萄糖的代谢途径', example_sentence: 'Gluconeogenesis occurs primarily in the liver during fasting.', example_translation: '空腹时糖异生主要发生在肝脏。', root: 'gluco- + neo- + -genesis', root_meaning: '糖+新+生成' },
    { english: 'ATP', chinese: '三磷酸腺苷', pronunciation: '/ˌeɪtiːˈpiː/', definition: '细胞的主要能量货币', example_sentence: 'ATP hydrolysis releases energy for cellular processes.', example_translation: 'ATP水解释放能量供细胞过程使用。', root: 'adenosin- + tri- + phosphat-', root_meaning: '腺苷+三+磷酸' },
    { english: 'mitochondria', chinese: '线粒体', pronunciation: '/ˌmaɪtəˈkɒndriən/', definition: '细胞的能量工厂，进行氧化磷酸化', example_sentence: 'Mitochondria contain their own DNA and ribosomes.', example_translation: '线粒体含有自身的DNA和核糖体。', root: 'mito- + chondr-', root_meaning: '线+颗粒' },
    { english: 'ribosome', chinese: '核糖体', pronunciation: '/ˈraɪbəsəʊm/', definition: '蛋白质合成的分子机器', example_sentence: 'Ribosomes translate mRNA into polypeptide chains.', example_translation: '核糖体将mRNA翻译为多肽链。', root: 'ribo- + -some', root_meaning: '核糖+体' },
    { english: 'transcription', chinese: '转录', pronunciation: '/trænˈskrɪpʃən/', definition: '以DNA为模板合成RNA的过程', example_sentence: 'Transcription is catalyzed by RNA polymerase in the nucleus.', example_translation: '转录由细胞核中的RNA聚合酶催化。', root: 'trans- + scrip-', root_meaning: '跨越+写' },
    { english: 'translation', chinese: '翻译', pronunciation: '/trænsˈleɪʃən/', definition: '以mRNA为模板合成蛋白质的过程', example_sentence: 'Translation occurs on ribosomes in the cytoplasm.', example_translation: '翻译在细胞质中的核糖体上进行。', root: 'trans- + lat-', root_meaning: '跨越+携带' },
    { english: 'replication', chinese: '复制', pronunciation: '/ˌreplɪˈkeɪʃən/', definition: 'DNA分子自我复制的过程', example_sentence: 'DNA replication is semiconservative and bidirectional.', example_translation: 'DNA复制是半保留和双向的。', root: 're- + plic-', root_meaning: '再次+折叠' },
    { english: 'codon', chinese: '密码子', pronunciation: '/ˈkəʊdɒn/', definition: 'mRNA上三个相邻核苷酸组成的编码单元', example_sentence: 'Each codon specifies a particular amino acid or a stop signal.', example_translation: '每个密码子指定一个特定的氨基酸或终止信号。', root: 'cod-', root_meaning: '编码' },
    { english: 'anticodon', chinese: '反密码子', pronunciation: '/ˌæntiˈkəʊdɒn/', definition: 'tRNA上与mRNA密码子互补的三核苷酸序列', example_sentence: 'The anticodon of tRNA pairs with the complementary codon on mRNA.', example_translation: 'tRNA的反密码子与mRNA上的互补密码子配对。', root: 'anti- + codon', root_meaning: '反+密码子' },
    { english: 'peptide', chinese: '肽', pronunciation: '/ˈpeptaɪd/', definition: '由氨基酸通过肽键连接而成的短链', example_sentence: 'Peptide bonds link amino acids together in proteins.', example_translation: '肽键将氨基酸连接成蛋白质。', root: 'pept-', root_meaning: '消化' },
    { english: 'lipid', chinese: '脂质', pronunciation: '/ˈlɪpɪd/', definition: '不溶于水的生物分子，包括脂肪和磷脂', example_sentence: 'Lipids form the bilayer structure of cell membranes.', example_translation: '脂质形成细胞膜的双层结构。', root: 'lip-', root_meaning: '脂肪' },
    { english: 'carbohydrate', chinese: '碳水化合物', pronunciation: '/ˌkɑːbəˈhaɪdreɪt/', definition: '由碳、氢、氧组成的生物分子，主要能量来源', example_sentence: 'Carbohydrates are the primary source of energy for the brain.', example_translation: '碳水化合物是大脑的主要能量来源。', root: 'carbo- + hydr-', root_meaning: '碳+水' },
    { english: 'nucleotide', chinese: '核苷酸', pronunciation: '/ˈnjuːkliətaɪd/', definition: '核酸的基本结构单元', example_sentence: 'Each nucleotide consists of a sugar, a phosphate, and a base.', example_translation: '每个核苷酸由一个糖、一个磷酸和一个碱基组成。', root: 'nucleo- + -tide', root_meaning: '核+酸' },
    { english: 'metabolism', chinese: '新陈代谢', pronunciation: '/mɪˈtæbəlɪzəm/', definition: '生物体内所有化学反应的总称', example_sentence: 'Metabolism includes both catabolic and anabolic pathways.', example_translation: '新陈代谢包括分解代谢和合成代谢途径。', root: 'meta- + bol-', root_meaning: '变化+投掷' },
    { english: 'apoptosis', chinese: '细胞凋亡', pronunciation: '/ˌæpəˈtəʊsɪs/', definition: '程序性细胞死亡，维持组织稳态', example_sentence: 'Apoptosis is a regulated process that eliminates damaged cells.', example_translation: '细胞凋亡是清除受损细胞的调控过程。', root: 'apo- + ptosis', root_meaning: '离开+落下' },
  ]

  for (const w of biochemWords) {
    db.run(
      `INSERT INTO words (subject_id, english, chinese, pronunciation, definition, example_sentence, example_translation, root, root_meaning)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [subject3Id, w.english, w.chinese, w.pronunciation, w.definition, w.example_sentence, w.example_translation, w.root, w.root_meaning]
    )
  }

  // === Pathology ===
  db.run(`INSERT INTO subjects (name, icon, is_preset) VALUES ('病理学', '🔬', 1)`)
  const subject4Id = (db.exec('SELECT last_insert_rowid()')![0].values[0][0] as number)

  const pathWords = [
    { english: 'inflammation', chinese: '炎症', pronunciation: '/ˌɪnfləˈmeɪʃən/', definition: '机体对损伤因子的防御反应', example_sentence: 'Acute inflammation is characterized by redness, swelling, heat, and pain.', example_translation: '急性炎症以红、肿、热、痛为特征。', root: 'inflamm-', root_meaning: '着火' },
    { english: 'necrosis', chinese: '坏死', pronunciation: '/nɪˈkrəʊsɪs/', definition: '细胞或组织的非程序性死亡', example_sentence: 'Coagulative necrosis is commonly seen in ischemic injury.', example_translation: '凝固性坏死常见于缺血性损伤。', root: 'necr- + -osis', root_meaning: '死亡+状态' },
    { english: 'hyperplasia', chinese: '增生', pronunciation: '/ˌhaɪpəˈpleɪʒə/', definition: '细胞数量增加导致的组织增大', example_sentence: 'Benign prostatic hyperplasia is common in elderly men.', example_translation: '良性前列腺增生在老年男性中很常见。', root: 'hyper- + -plasia', root_meaning: '过度+形成' },
    { english: 'hypertrophy', chinese: '肥大', pronunciation: '/haɪˈpɜːtrəfi/', definition: '细胞体积增大导致的组织增大', example_sentence: 'Cardiac hypertrophy occurs in response to chronic hypertension.', example_translation: '心脏肥大是对慢性高血压的反应。', root: 'hyper- + -trophy', root_meaning: '过度+营养' },
    { english: 'atrophy', chinese: '萎缩', pronunciation: '/ˈætrəfi/', definition: '细胞体积缩小或数量减少导致的组织缩小', example_sentence: 'Muscle atrophy occurs after prolonged immobilization.', example_translation: '长期固定后会发生肌肉萎缩。', root: 'a- + -trophy', root_meaning: '无+营养' },
    { english: 'metaplasia', chinese: '化生', pronunciation: '/ˌmetəˈpleɪʒə/', definition: '一种分化成熟的细胞被另一种替代', example_sentence: 'Barrett esophagus involves intestinal metaplasia of the esophageal epithelium.', example_translation: 'Barrett食管涉及食管上皮的肠化生。', root: 'meta- + -plasia', root_meaning: '变化+形成' },
    { english: 'dysplasia', chinese: '异型增生', pronunciation: '/dɪsˈpleɪʒə/', definition: '细胞形态和排列的异常改变', example_sentence: 'Cervical dysplasia is a precancerous condition detected by Pap smear.', example_translation: '宫颈异型增生是一种通过巴氏涂片检测的癌前状态。', root: 'dys- + -plasia', root_meaning: '异常+形成' },
    { english: 'carcinoma', chinese: '癌', pronunciation: '/ˌkɑːrsɪˈnəʊmə/', definition: '来源于上皮组织的恶性肿瘤', example_sentence: 'Squamous cell carcinoma arises from the squamous epithelium.', example_translation: '鳞状细胞癌来源于鳞状上皮。', root: 'carcin- + -oma', root_meaning: '螃蟹+肿瘤' },
    { english: 'sarcoma', chinese: '肉瘤', pronunciation: '/sɑːrˈkəʊmə/', definition: '来源于间叶组织的恶性肿瘤', example_sentence: 'Osteosarcoma is the most common primary bone sarcoma.', example_translation: '骨肉瘤是最常见的原发性骨肉瘤。', root: 'sarc- + -oma', root_meaning: '肉+肿瘤' },
    { english: 'lymphoma', chinese: '淋巴瘤', pronunciation: '/lɪmˈfəʊmə/', definition: '来源于淋巴组织的恶性肿瘤', example_sentence: 'Hodgkin lymphoma is characterized by Reed-Sternberg cells.', example_translation: '霍奇金淋巴瘤以Reed-Sternberg细胞为特征。', root: 'lymph- + -oma', root_meaning: '淋巴+肿瘤' },
    { english: 'leukemia', chinese: '白血病', pronunciation: '/luːˈkiːmiə/', definition: '造血系统的恶性肿瘤', example_sentence: 'Acute lymphoblastic leukemia is the most common childhood cancer.', example_translation: '急性淋巴细胞白血病是最常见的儿童癌症。', root: 'leuk- + -emia', root_meaning: '白色+血液' },
    { english: 'metastasis', chinese: '转移', pronunciation: '/mɪˈtæstəsɪs/', definition: '癌细胞从原发部位扩散到远处器官', example_sentence: 'Liver metastasis is a common complication of colorectal cancer.', example_translation: '肝转移是结直肠癌的常见并发症。', root: 'meta- + stasis', root_meaning: '变化+站立' },
    { english: 'angiogenesis', chinese: '血管生成', pronunciation: '/ˌændʒiəˈdʒenɪsɪs/', definition: '从已有血管形成新血管的过程', example_sentence: 'Tumor angiogenesis is essential for cancer growth beyond 2 mm.', example_translation: '肿瘤血管生成对超过2毫米的癌症生长至关重要。', root: 'angio- + -genesis', root_meaning: '血管+生成' },
    { english: 'ischemia', chinese: '缺血', pronunciation: '/ɪˈskiːmiə/', definition: '组织血液供应不足', example_sentence: 'Myocardial ischemia results from coronary artery obstruction.', example_translation: '心肌缺血由冠状动脉阻塞引起。', root: 'isch- + -emia', root_meaning: '抑制+血液' },
    { english: 'infarction', chinese: '梗死', pronunciation: '/ɪnˈfɑːrkʃən/', definition: '因缺血导致的组织坏死', example_sentence: 'Myocardial infarction requires immediate reperfusion therapy.', example_translation: '心肌梗死需要立即再灌注治疗。', root: 'infarct-', root_meaning: '填塞' },
    { english: 'thrombosis', chinese: '血栓形成', pronunciation: '/θrɒmˈbəʊsɪs/', definition: '血管内异常血凝块形成', example_sentence: 'Deep vein thrombosis can lead to pulmonary embolism.', example_translation: '深静脉血栓形成可导致肺栓塞。', root: 'thromb- + -osis', root_meaning: '凝块+状态' },
    { english: 'edema', chinese: '水肿', pronunciation: '/ɪˈdiːmə/', definition: '组织间隙积液过多', example_sentence: 'Pulmonary edema is a life-threatening condition requiring urgent treatment.', example_translation: '肺水肿是一种需要紧急治疗的危及生命的状况。', root: 'edem-', root_meaning: '肿胀' },
  ]

  for (const w of pathWords) {
    db.run(
      `INSERT INTO words (subject_id, english, chinese, pronunciation, definition, example_sentence, example_translation, root, root_meaning)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [subject4Id, w.english, w.chinese, w.pronunciation, w.definition, w.example_sentence, w.example_translation, w.root, w.root_meaning]
    )
  }

  // === Pharmacology ===
  db.run(`INSERT INTO subjects (name, icon, is_preset) VALUES ('药理学', '💊', 1)`)
  const subject5Id = (db.exec('SELECT last_insert_rowid()')![0].values[0][0] as number)

  const pharmWords = [
    { english: 'agonist', chinese: '激动剂', pronunciation: '/ˈæɡənɪst/', definition: '与受体结合并产生生物学效应的药物', example_sentence: 'Morphine is a potent agonist at mu-opioid receptors.', example_translation: '吗啡是μ-阿片受体的强效激动剂。', root: 'agon-', root_meaning: '竞争、斗争' },
    { english: 'antagonist', chinese: '拮抗剂', pronunciation: '/ænˈtæɡənɪst/', definition: '与受体结合但不产生效应的药物，阻断激动剂作用', example_sentence: 'Naloxone is an opioid antagonist used to reverse overdose.', example_translation: '纳洛酮是一种阿片类拮抗剂，用于逆转药物过量。', root: 'ant- + agon-', root_meaning: '对抗+竞争' },
    { english: 'pharmacokinetics', chinese: '药代动力学', pronunciation: '/ˌfɑːrməkəʊkɪˈnetɪks/', definition: '研究药物在体内的吸收、分布、代谢和排泄', example_sentence: 'Pharmacokinetics determines the dosing regimen of a drug.', example_translation: '药代动力学决定了药物的给药方案。', root: 'pharmaco- + kinet-', root_meaning: '药物+运动' },
    { english: 'pharmacodynamics', chinese: '药效动力学', pronunciation: '/ˌfɑːrməkəʊdaɪˈnæmɪks/', definition: '研究药物对机体的作用及机制', example_sentence: 'Pharmacodynamics explains the relationship between drug concentration and effect.', example_translation: '药效动力学解释了药物浓度与效应之间的关系。', root: 'pharmaco- + dynam-', root_meaning: '药物+力量' },
    { english: 'bioavailability', chinese: '生物利用度', pronunciation: '/ˌbaɪəʊəˌveɪləˈbɪlɪti/', definition: '药物到达体循环的比例', example_sentence: 'Oral bioavailability is affected by first-pass hepatic metabolism.', example_translation: '口服生物利用度受肝脏首过代谢影响。', root: 'bio- + avail-', root_meaning: '生物+可用' },
    { english: 'half-life', chinese: '半衰期', pronunciation: '/ˈhɑːf laɪf/', definition: '药物血浆浓度降低一半所需的时间', example_sentence: 'The half-life of a drug determines the dosing frequency.', example_translation: '药物的半衰期决定了给药频率。', root: 'half + life', root_meaning: '一半+生命' },
    { english: 'metabolism', chinese: '代谢', pronunciation: '/mɪˈtæbəlɪzəm/', definition: '药物在体内的化学转化过程', example_sentence: 'Cytochrome P450 enzymes are responsible for drug metabolism.', example_translation: '细胞色素P450酶负责药物代谢。', root: 'meta- + bol-', root_meaning: '变化+投掷' },
    { english: 'excretion', chinese: '排泄', pronunciation: '/ɪkˈskriːʃən/', definition: '药物及其代谢产物从体内排出的过程', example_sentence: 'Renal excretion is the primary route of elimination for many drugs.', example_translation: '肾排泄是许多药物的主要消除途径。', root: 'ex- + cret-', root_meaning: '出+分离' },
    { english: 'receptor', chinese: '受体', pronunciation: '/rɪˈseptər/', definition: '与药物结合并介导药理效应的蛋白质', example_sentence: 'G protein-coupled receptors are the largest family of drug targets.', example_translation: 'G蛋白偶联受体是最大的药物靶点家族。', root: 're- + cept-', root_meaning: '再次+接收' },
    { english: 'dose-response', chinese: '剂量-反应关系', pronunciation: '/ˈdəʊs rɪˈspɒns/', definition: '药物剂量与效应强度之间的关系', example_sentence: 'The dose-response curve is used to determine the therapeutic window.', example_translation: '剂量-反应曲线用于确定治疗窗。', root: 'dose + response', root_meaning: '剂量+反应' },
    { english: 'efficacy', chinese: '效能', pronunciation: '/ˈefɪkəsi/', definition: '药物产生最大效应的能力', example_sentence: 'Efficacy refers to the maximum effect a drug can produce.', example_translation: '效能指药物能产生的最大效应。', root: 'effic-', root_meaning: '有效' },
    { english: 'affinity', chinese: '亲和力', pronunciation: '/əˈfɪnɪti/', definition: '药物与受体结合的能力', example_sentence: 'A drug with high affinity binds tightly to its receptor.', example_translation: '高亲和力的药物与受体结合紧密。', root: 'af- + fin-', root_meaning: '向+边界' },
    { english: 'tolerance', chinese: '耐受性', pronunciation: '/ˈtɒlərəns/', definition: '反复用药后药效降低的现象', example_sentence: 'Chronic opioid use leads to tolerance requiring dose escalation.', example_translation: '长期使用阿片类药物会导致耐受性，需要增加剂量。', root: 'toler-', root_meaning: '容忍' },
    { english: 'withdrawal', chinese: '戒断反应', pronunciation: '/wɪðˈdrɔːəl/', definition: '停止用药后出现的不适症状', example_sentence: 'Alcohol withdrawal can be life-threatening and requires medical supervision.', example_translation: '酒精戒断反应可能危及生命，需要医疗监护。', root: 'with- + draw-', root_meaning: '向后+拉' },
    { english: 'placebo', chinese: '安慰剂', pronunciation: '/pləˈsiːbəʊ/', definition: '无药理活性的物质，用于对照试验', example_sentence: 'The placebo effect demonstrates the power of expectation in treatment.', example_translation: '安慰剂效应证明了期望在治疗中的力量。', root: 'placeb-', root_meaning: '我将取悦' },
    { english: 'contraindication', chinese: '禁忌症', pronunciation: '/ˌkɒntrəˌɪndɪˈkeɪʃən/', definition: '不应使用某种药物的情况', example_sentence: 'Pregnancy is a contraindication for many teratogenic drugs.', example_translation: '妊娠是许多致畸药物的禁忌症。', root: 'contra- + indic-', root_meaning: '反对+指示' },
    { english: 'adverse effect', chinese: '不良反应', pronunciation: '/ˈædvɜːrs ɪˈfekt/', definition: '药物治疗中出现的非预期有害反应', example_sentence: 'Adverse effects must be reported in clinical trials for drug approval.', example_translation: '不良反应必须在临床试验中报告以获得药物批准。', root: 'adverse + effect', root_meaning: '不利+效应' },
    { english: 'therapeutic index', chinese: '治疗指数', pronunciation: '/ˌθerəˈpjuːtɪk ˈɪndeks/', definition: '药物安全性的衡量指标，TD50/ED50', example_sentence: 'A narrow therapeutic index requires careful monitoring of drug levels.', example_translation: '狭窄的治疗指数需要仔细监测药物浓度。', root: 'therapeut- + index', root_meaning: '治疗+指数' },
  ]

  for (const w of pharmWords) {
    db.run(
      `INSERT INTO words (subject_id, english, chinese, pronunciation, definition, example_sentence, example_translation, root, root_meaning)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [subject5Id, w.english, w.chinese, w.pronunciation, w.definition, w.example_sentence, w.example_translation, w.root, w.root_meaning]
    )
  }
}