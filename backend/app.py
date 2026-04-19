"""
AI Job Readiness Backend — Flask API
Trains the model on first run, saves .pkl files, then serves predictions.
Run: pip install flask flask-cors scikit-learn xgboost pandas numpy scipy && python app.py
"""

import os, json, pickle, warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from scipy.sparse import hstack, csr_matrix

# ── sklearn / xgboost ────────────────────────────────────────────────────────
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score
try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

app = Flask(__name__)
CORS(app)

MODEL_DIR  = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# ── Global objects loaded at startup ─────────────────────────────────────────
MODEL       = None
TFIDF_S     = None
TFIDF_P     = None
TFIDF_C     = None
SCALER      = None
LE_TARGET   = None
LE_ROLE     = None
TFIDF_REC   = None
ROLE_VECS   = None

ROLE_NAMES  = [
    "Data Analyst", "Software Developer", "ML Engineer",
    "Web Developer", "Backend Developer", "Business Analyst", "Cloud Engineer"
]
ROLE_KEYS   = [
    "data_analyst","software_developer","ml_engineer",
    "web_developer","backend_developer","business_analyst","cloud_engineer"
]
ROLE_SKILL_STRINGS = {
    "Data Analyst":       "Python SQL Excel Tableau Power BI Statistics R Data Cleaning Pandas NumPy",
    "Software Developer": "Java C++ Python Git OOP Data Structures Algorithms Linux REST API Unit Testing",
    "ML Engineer":        "Python Machine Learning Deep Learning TensorFlow Scikit-learn PyTorch NLP SQL Statistics Pandas",
    "Web Developer":      "HTML CSS JavaScript React Node.js Git MongoDB REST API Bootstrap TypeScript",
    "Backend Developer":  "Python Django Flask SQL REST API Docker Kubernetes Git Linux Microservices",
    "Business Analyst":   "Excel SQL Statistics Power BI Tableau Communication Data Analysis Business Intelligence Project Management JIRA",
    "Cloud Engineer":     "AWS Azure GCP Docker Kubernetes Terraform Linux CI/CD Python Networking"
}
ROLE_REQUIRED_SKILLS = {
    "Data Analyst":       ["Python","SQL","Excel","Tableau","Power BI","Statistics","R","Data Cleaning","Pandas","NumPy"],
    "Software Developer": ["Java","C++","Python","Git","OOP","Data Structures","Algorithms","Linux","REST API","Unit Testing"],
    "ML Engineer":        ["Python","Machine Learning","Deep Learning","TensorFlow","Scikit-learn","PyTorch","NLP","SQL","Statistics","Pandas"],
    "Web Developer":      ["HTML","CSS","JavaScript","React","Node.js","Git","MongoDB","REST API","Bootstrap","TypeScript"],
    "Backend Developer":  ["Python","Django","Flask","SQL","REST API","Docker","Kubernetes","Git","Linux","Microservices"],
    "Business Analyst":   ["Excel","SQL","Statistics","Power BI","Tableau","Communication","Data Analysis","Business Intelligence","Project Management","JIRA"],
    "Cloud Engineer":     ["AWS","Azure","GCP","Docker","Kubernetes","Terraform","Linux","CI/CD","Python","Networking"]
}

SKILL_POOL = {
    "data_analyst":       ["Python","SQL","Excel","Tableau","Power BI","Statistics","R","Data Cleaning","Pandas","NumPy"],
    "software_developer": ["Java","C++","Python","Git","OOP","Data Structures","Algorithms","Linux","REST API","Unit Testing"],
    "ml_engineer":        ["Python","Machine Learning","Deep Learning","TensorFlow","Scikit-learn","PyTorch","NLP","SQL","Statistics","Pandas"],
    "web_developer":      ["HTML","CSS","JavaScript","React","Node.js","Git","MongoDB","REST API","Bootstrap","TypeScript"],
    "backend_developer":  ["Python","Django","Flask","SQL","REST API","Docker","Kubernetes","Git","Linux","Microservices"],
    "business_analyst":   ["Excel","SQL","Statistics","Power BI","Tableau","Communication","Data Analysis","Business Intelligence","Project Management","JIRA"],
    "cloud_engineer":     ["AWS","Azure","GCP","Docker","Kubernetes","Terraform","Linux","CI/CD","Python","Networking"]
}
CERT_POOL    = ["AWS Certified","Google Cloud Certified","Azure Fundamentals","TensorFlow Developer",
                "Meta Front-End Developer","IBM Data Science","Coursera ML Specialization","Oracle Java SE","Cisco Networking","PMI Agile"]
PROJECT_POOL = ["E-commerce Website","Sentiment Analysis","Chatbot Development","Image Classifier",
                "Sales Dashboard","Inventory Management System","REST API Service","Portfolio Website",
                "Data Pipeline","Stock Price Predictor","Face Recognition","Recommendation Engine",
                "Cloud Deployment","Budget Tracker","Job Portal"]

import random
random.seed(42)
np.random.seed(42)

ALL_SKILLS = list({s for skills in SKILL_POOL.values() for s in skills})

# ── Dataset generator ─────────────────────────────────────────────────────────
def generate_dataset(n=8000):
    rows = []
    for _ in range(n):
        rk    = random.choice(ROLE_KEYS)
        rl    = ROLE_NAMES[ROLE_KEYS.index(rk)]
        core  = random.sample(SKILL_POOL[rk], k=random.randint(2, len(SKILL_POOL[rk])))
        extra = random.sample(ALL_SKILLS, k=random.randint(0,3))
        skills = ", ".join(list(dict.fromkeys(core+extra)))
        n_sk   = len(set(skills.split(", ")))
        n_pr   = random.randint(0,6)
        n_ce   = random.randint(0,3)
        cgpa   = round(np.clip(np.random.normal(7.2,1.0),4.0,10.0),2)
        n_in   = random.randint(0,3)
        comm   = random.randint(1,10)
        apt    = random.randint(30,100)
        ps     = random.randint(1,10)
        certs  = ", ".join(random.sample(CERT_POOL, k=min(n_ce,len(CERT_POOL)))) if n_ce else "None"
        projs  = ", ".join(random.sample(PROJECT_POOL, k=min(n_pr+1,len(PROJECT_POOL)))) if n_pr else "None"
        score  = ((cgpa-4)/6*25 + min(n_sk/10,1)*20 + min(n_pr/5,1)*15 +
                  min(n_in/3,1)*15 + min(n_ce/3,1)*10 + comm/10*8 + (apt-30)/70*7)
        score += np.random.normal(0,5)
        score  = np.clip(score,0,100)
        rows.append({
            "Skills":skills,"Projects":projs,"Certifications":certs,
            "CGPA":cgpa,"Internships":n_in,"Communication_Skills":comm,
            "Aptitude_Score":apt,"Problem_Solving":ps,
            "Role_Interest":rl,"Job_Ready":"Yes" if score>=50 else "No"
        })
    return pd.DataFrame(rows)

# ── Train & persist ───────────────────────────────────────────────────────────
def train_and_save():
    print("🔧  Training model on 8,000 rows …")
    df = generate_dataset(8000)

    le_t = LabelEncoder(); df["JR_enc"]   = le_t.fit_transform(df["Job_Ready"])
    le_r = LabelEncoder(); df["RI_enc"]   = le_r.fit_transform(df["Role_Interest"])

    ts  = TfidfVectorizer(max_features=50, token_pattern=r"[^,]+")
    tp  = TfidfVectorizer(max_features=20, token_pattern=r"[^,]+")
    tc  = TfidfVectorizer(max_features=15, token_pattern=r"[^,]+")
    Xs  = ts.fit_transform(df["Skills"])
    Xp  = tp.fit_transform(df["Projects"])
    Xc  = tc.fit_transform(df["Certifications"])

    num_cols = ["CGPA","Internships","Communication_Skills","Aptitude_Score","Problem_Solving","RI_enc"]
    sc  = StandardScaler()
    Xn  = csr_matrix(sc.fit_transform(df[num_cols]))
    X   = hstack([Xs,Xp,Xc,Xn])
    y   = df["JR_enc"].values

    Xtr,Xte,ytr,yte = train_test_split(X,y,test_size=0.2,random_state=42,stratify=y)

    if HAS_XGB:
        clf = XGBClassifier(n_estimators=200,max_depth=6,learning_rate=0.1,
                            use_label_encoder=False,eval_metric="logloss",
                            random_state=42,n_jobs=-1)
    else:
        clf = RandomForestClassifier(n_estimators=200,max_depth=15,random_state=42,n_jobs=-1)

    clf.fit(Xtr,ytr)
    acc = accuracy_score(yte, clf.predict(Xte))
    auc = roc_auc_score(yte, clf.predict_proba(Xte)[:,1])
    print(f"   ✅  Accuracy: {acc:.4f}  |  ROC-AUC: {auc:.4f}")

    # Recommendation TF-IDF
    tr_rec  = TfidfVectorizer()
    corpus  = list(ROLE_SKILL_STRINGS.values()) + df["Skills"].tolist()
    tr_rec.fit(corpus)
    rv = tr_rec.transform(list(ROLE_SKILL_STRINGS.values()))

    bundle = dict(model=clf,tfidf_s=ts,tfidf_p=tp,tfidf_c=tc,scaler=sc,
                  le_target=le_t,le_role=le_r,tfidf_rec=tr_rec,role_vecs=rv)
    with open(os.path.join(MODEL_DIR,"bundle.pkl"),"wb") as f:
        pickle.dump(bundle,f)
    print("   💾  Saved to models/bundle.pkl")
    return bundle

# ── Load or train ─────────────────────────────────────────────────────────────
def load_or_train():
    global MODEL,TFIDF_S,TFIDF_P,TFIDF_C,SCALER,LE_TARGET,LE_ROLE,TFIDF_REC,ROLE_VECS
    pkl = os.path.join(MODEL_DIR,"bundle.pkl")
    if os.path.exists(pkl):
        print("📦  Loading saved model …")
        with open(pkl,"rb") as f:
            b = pickle.load(f)
    else:
        b = train_and_save()
    MODEL=b["model"];TFIDF_S=b["tfidf_s"];TFIDF_P=b["tfidf_p"]
    TFIDF_C=b["tfidf_c"];SCALER=b["scaler"];LE_TARGET=b["le_target"]
    LE_ROLE=b["le_role"];TFIDF_REC=b["tfidf_rec"];ROLE_VECS=b["role_vecs"]
    print("✅  Model ready.")

def encode_user(data):
    skills = data.get("skills","")
    projs  = data.get("projects","None")
    certs  = data.get("certifications","None")
    role   = data.get("role_interest","ML Engineer")
    cgpa   = float(data.get("cgpa",7.0))
    intern_= int(data.get("internships",0))
    comm   = int(data.get("communication_skills",5))
    apt    = int(data.get("aptitude_score",60))
    ps     = int(data.get("problem_solving",5))

    xs = TFIDF_S.transform([skills])
    xp = TFIDF_P.transform([projs])
    xc = TFIDF_C.transform([certs])
    known = list(LE_ROLE.classes_)
    re = LE_ROLE.transform([role])[0] if role in known else 0
    xn = csr_matrix(SCALER.transform(pd.DataFrame([{
        "CGPA":cgpa,"Internships":intern_,"Communication_Skills":comm,
        "Aptitude_Score":apt,"Problem_Solving":ps,"RI_enc":re
    }])))
    return hstack([xs,xp,xc,xn])

def recommend_roles(skills_str, top_n=3):
    uv   = TFIDF_REC.transform([skills_str])
    from sklearn.metrics.pairwise import cosine_similarity
    sims = cosine_similarity(uv, ROLE_VECS).flatten()
    idx  = sims.argsort()[::-1][:top_n]
    return [{"role":ROLE_NAMES[i],"score":round(float(sims[i])*100,1)} for i in idx]

def skill_gap(skills_str, target_role):
    user = {s.strip().lower() for s in skills_str.split(",")}
    req  = ROLE_REQUIRED_SKILLS.get(target_role,[])
    have    = [s for s in req if s.lower() in user]
    missing = [s for s in req if s.lower() not in user]
    cov     = round(len(have)/len(req)*100,1) if req else 0
    return {"have":have,"missing":missing,"coverage":cov}

# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return jsonify({"status":"ok","model": type(MODEL).__name__})

@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    X    = encode_user(data)
    pred = MODEL.predict(X)[0]
    conf = float(MODEL.predict_proba(X)[0][1]*100)
    lbl  = LE_TARGET.inverse_transform([pred])[0]

    skills_str  = data.get("skills","")
    top3        = recommend_roles(skills_str)
    primary     = top3[0]["role"] if top3 else ""
    gap         = skill_gap(skills_str, primary)

    return jsonify({
        "job_ready": lbl,
        "confidence": round(conf,1),
        "ready": lbl=="Yes",
        "top_roles": top3,
        "skill_gap": {
            "target_role": primary,
            "have": gap["have"],
            "missing": gap["missing"],
            "coverage": gap["coverage"]
        }
    })

@app.route("/api/roles", methods=["GET"])
def roles():
    return jsonify({"roles": ROLE_NAMES})

@app.route("/api/skills", methods=["GET"])
def skills_list():
    return jsonify({"skills": sorted(ALL_SKILLS)})

@app.route("/api/retrain", methods=["POST"])
def retrain():
    pkl = os.path.join(MODEL_DIR,"bundle.pkl")
    if os.path.exists(pkl): os.remove(pkl)
    load_or_train()
    return jsonify({"status":"retrained"})

if __name__ == "__main__":
    load_or_train()
    app.run(debug=True, port=5000)
