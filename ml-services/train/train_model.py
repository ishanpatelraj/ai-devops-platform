"""
Model Training Script.

Trains all three ML models and saves them to ./saved_models/.
Run with:  python train/train_models.py

Three models trained:
  1. Anomaly Detection   — Isolation Forest      → anomaly_model.pkl
  2. Failure Prediction  — Random Forest          → failure_model.pkl
  3. Log Classification  — TF-IDF + Naive Bayes   → log_classifier.pkl
"""

import numpy as np
import joblib
import os
from sklearn.ensemble                  import IsolationForest, RandomForestClassifier
from sklearn.naive_bayes               import MultinomialNB
from sklearn.feature_extraction.text   import TfidfVectorizer
from sklearn.pipeline                  import Pipeline

SAVE_DIR = "./saved_models"
os.makedirs(SAVE_DIR, exist_ok=True)


# ── 1. Anomaly Detection ─────────────────────────────────────────────────────

def train_anomaly_model():
    """
    Trains Isolation Forest on synthetic normal server metrics.

    Training strategy:
    - 1000 samples of healthy metrics (CPU 10–70%, MEM 20–65%, DISK 10–60%)
    - 200 samples of elevated-but-normal metrics (CPU 60–80%)
    - contamination=0.05 tells the model to expect ~5% anomalies in real data
    """
    print("Training Anomaly Detection Model...")

    np.random.seed(42)
    n = 1000

    # Normal operating range
    normal = np.column_stack([
        np.random.uniform(0.10, 0.70, n),   # CPU
        np.random.uniform(0.20, 0.65, n),   # Memory
        np.random.uniform(0.10, 0.60, n),   # Disk
        np.random.uniform(0.01, 0.40, n),   # Network In
        np.random.uniform(0.01, 0.30, n),   # Network Out
    ])

    # Elevated-but-acceptable range (busy hours)
    elevated = np.column_stack([
        np.random.uniform(0.60, 0.80, 200),
        np.random.uniform(0.55, 0.75, 200),
        np.random.uniform(0.50, 0.70, 200),
        np.random.uniform(0.30, 0.50, 200),
        np.random.uniform(0.20, 0.40, 200),
    ])

    training_data = np.vstack([normal, elevated])

    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(training_data)

    model_path = os.path.join(SAVE_DIR, "anomaly_model.pkl")
    joblib.dump(model, model_path)
    print(f"  [OK] Saved to {model_path}")

    # Sanity checks
    print("  Test results:")
    tests = [
        ("Normal  [40%, 35%, 30%]", np.array([[0.40, 0.35, 0.30, 0.10, 0.08]])),
        ("Anomaly [95%, 92%, 88%]", np.array([[0.95, 0.92, 0.88, 0.90, 0.85]])),
    ]
    for label, sample in tests:
        pred = model.predict(sample)
        print(f"    {label} -> {'ANOMALY' if pred[0] == -1 else 'Normal'}")
    print()


# ── 2. Failure Prediction ────────────────────────────────────────────────────

def train_failure_model():
    """
    Trains Random Forest Classifier on labelled synthetic metric data.

    Training strategy:
    - 800 healthy samples  (label 0 — no failure)
    - 300 stressed samples (label 1 — failure)
    - 200 borderline cases (label 0 or 1 with 40% failure rate)
    - class_weight='balanced' compensates for the 800:300 imbalance
    """
    print("Training Failure Prediction Model...")

    np.random.seed(42)

    # Healthy servers
    X_healthy = np.column_stack([
        np.random.uniform(0.05, 0.70, 800),
        np.random.uniform(0.10, 0.65, 800),
        np.random.uniform(0.05, 0.60, 800),
        np.random.uniform(0.01, 0.40, 800),
        np.random.uniform(0.01, 0.30, 800),
    ])
    y_healthy = np.zeros(800)

    # Failing servers — high resource utilisation
    X_failure = np.column_stack([
        np.random.uniform(0.75, 1.00, 300),
        np.random.uniform(0.70, 1.00, 300),
        np.random.uniform(0.65, 1.00, 300),
        np.random.uniform(0.50, 1.00, 300),
        np.random.uniform(0.40, 1.00, 300),
    ])
    y_failure = np.ones(300)

    # Borderline cases
    X_border = np.column_stack([
        np.random.uniform(0.60, 0.85, 200),
        np.random.uniform(0.55, 0.80, 200),
        np.random.uniform(0.50, 0.75, 200),
        np.random.uniform(0.30, 0.60, 200),
        np.random.uniform(0.20, 0.50, 200),
    ])
    y_border = (np.random.random(200) > 0.6).astype(float)   # 40% fail

    X_train = np.vstack([X_healthy, X_failure, X_border])
    y_train = np.concatenate([y_healthy, y_failure, y_border])

    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, class_weight='balanced')
    model.fit(X_train, y_train)

    model_path = os.path.join(SAVE_DIR, "failure_model.pkl")
    joblib.dump(model, model_path)
    print(f"  [OK] Saved to {model_path}")

    # Sanity checks
    print("  Test results:")
    tests = [
        ("Healthy  [30%, 25%, 20%]",  np.array([[0.30, 0.25, 0.20, 0.10, 0.05]])),
        ("Stressed [92%, 88%, 85%]",  np.array([[0.92, 0.88, 0.85, 0.70, 0.60]])),
    ]
    for label, sample in tests:
        pred = model.predict(sample)
        prob = model.predict_proba(sample)[0][1]
        print(f"    {label} -> Fail={'Yes' if pred[0]==1 else 'No'}, Prob={prob:.2f}")
    print()


# ── 3. Log Classification ────────────────────────────────────────────────────

def train_log_classifier():
    """
    Trains a TF-IDF + Naive Bayes Pipeline on labelled log strings.

    Training strategy:
    - 15 example logs per category (120 total)
    - TfidfVectorizer uses unigrams + bigrams (ngram_range=(1,2))
    - MultinomialNB with alpha=0.1 prevents zero-probability issues
    - Wrapped in Pipeline so vectorisation is always applied before prediction
    """
    print("Training Log Classification Model...")

    training_logs = [
        # ── Database Error ────────────────────────────────────────────────────
        ("database connection timeout after 30 seconds",         "Database Error"),
        ("mysql connection refused on port 3306",                "Database Error"),
        ("mongodb replica set connection failed",                "Database Error"),
        ("query execution timeout exceeded",                     "Database Error"),
        ("database deadlock detected rolling back transaction",  "Database Error"),
        ("postgres connection pool exhausted",                   "Database Error"),
        ("sql syntax error in query execution",                  "Database Error"),
        ("database replication lag detected",                    "Database Error"),
        ("connection to database server lost",                   "Database Error"),
        ("db write operation failed disk full",                  "Database Error"),
        ("redis connection timeout",                             "Database Error"),
        ("database migration failed",                            "Database Error"),
        ("unable to acquire database lock",                      "Database Error"),
        ("database index corruption detected",                   "Database Error"),
        ("mongo cursor timeout exception",                       "Database Error"),

        # ── Network Error ─────────────────────────────────────────────────────
        ("network timeout connecting to external api",           "Network Error"),
        ("dns resolution failed for hostname",                   "Network Error"),
        ("socket connection reset by peer",                      "Network Error"),
        ("http request timeout after 60 seconds",               "Network Error"),
        ("ssl handshake failed certificate expired",             "Network Error"),
        ("tcp connection refused on port 443",                   "Network Error"),
        ("network interface eth0 went down",                     "Network Error"),
        ("packet loss detected on network route",                "Network Error"),
        ("load balancer health check failed",                    "Network Error"),
        ("upstream server unreachable",                          "Network Error"),
        ("502 bad gateway error from proxy",                     "Network Error"),
        ("503 service unavailable",                              "Network Error"),
        ("connection timed out to remote server",               "Network Error"),
        ("network bandwidth threshold exceeded",                 "Network Error"),
        ("dns lookup failure for service discovery",             "Network Error"),

        # ── Authentication Error ──────────────────────────────────────────────
        ("user login failed invalid credentials",                "Authentication Error"),
        ("jwt token expired for user session",                   "Authentication Error"),
        ("unauthorized access attempt detected",                 "Authentication Error"),
        ("invalid api key provided in request",                  "Authentication Error"),
        ("session expired please login again",                   "Authentication Error"),
        ("oauth token refresh failed",                           "Authentication Error"),
        ("too many failed login attempts account locked",        "Authentication Error"),
        ("password reset token invalid or expired",              "Authentication Error"),
        ("permission denied insufficient privileges",            "Authentication Error"),
        ("401 unauthorized access to protected resource",        "Authentication Error"),
        ("403 forbidden user lacks required role",               "Authentication Error"),
        ("two factor authentication failed",                     "Authentication Error"),
        ("api rate limit exceeded for user",                     "Authentication Error"),
        ("invalid bearer token format",                          "Authentication Error"),
        ("cors policy blocked request from origin",              "Authentication Error"),

        # ── System Error ──────────────────────────────────────────────────────
        ("kernel panic not syncing fatal exception",             "System Error"),
        ("out of memory killer invoked process terminated",      "System Error"),
        ("segmentation fault core dumped",                       "System Error"),
        ("system disk full no space left on device",             "System Error"),
        ("critical system process crashed unexpected",           "System Error"),
        ("hardware failure detected on storage device",          "System Error"),
        ("system clock skew detected ntp sync failed",           "System Error"),
        ("kernel module failed to load",                         "System Error"),
        ("file system corruption detected on mount",             "System Error"),
        ("oom kill process using too much memory",               "System Error"),
        ("fatal system error requiring reboot",                  "System Error"),
        ("cpu temperature critical threshold exceeded",          "System Error"),
        ("raid array degraded disk failure",                     "System Error"),
        ("swap space exhausted system unstable",                 "System Error"),
        ("inode limit reached cannot create new files",          "System Error"),

        # ── Application Error ─────────────────────────────────────────────────
        ("unhandled exception in request handler",               "Application Error"),
        ("null pointer exception in user service",               "Application Error"),
        ("application crashed with stack trace",                 "Application Error"),
        ("undefined reference error in module",                  "Application Error"),
        ("type error cannot read property of undefined",         "Application Error"),
        ("memory leak detected in worker process",               "Application Error"),
        ("application failed to start dependency missing",       "Application Error"),
        ("request processing failed internal error",             "Application Error"),
        ("configuration error invalid settings",                 "Application Error"),
        ("service dependency not available",                     "Application Error"),
        ("thread pool exhausted request rejected",               "Application Error"),
        ("cache miss rate exceeding threshold",                  "Application Error"),
        ("message queue consumer crashed",                       "Application Error"),
        ("background job failed with error",                     "Application Error"),
        ("api response serialization error",                     "Application Error"),

        # ── Security Warning ──────────────────────────────────────────────────
        ("potential sql injection attempt detected",             "Security Warning"),
        ("brute force attack detected from ip address",          "Security Warning"),
        ("suspicious file upload attempt blocked",               "Security Warning"),
        ("cross site scripting xss attempt detected",            "Security Warning"),
        ("unauthorized port scan detected",                      "Security Warning"),
        ("malware signature detected in uploaded file",          "Security Warning"),
        ("security certificate about to expire",                 "Security Warning"),
        ("unusual login pattern detected for user",              "Security Warning"),
        ("ddos attack detected high traffic volume",             "Security Warning"),
        ("intrusion detection system alert triggered",           "Security Warning"),
        ("privilege escalation attempt blocked",                 "Security Warning"),
        ("data exfiltration attempt detected",                   "Security Warning"),
        ("vulnerability scan detected from external ip",         "Security Warning"),
        ("firewall rule violation logged",                       "Security Warning"),
        ("encryption key rotation required",                     "Security Warning"),

        # ── Performance Warning ───────────────────────────────────────────────
        ("response time exceeded threshold 5 seconds",          "Performance Warning"),
        ("high cpu utilization detected 90 percent",            "Performance Warning"),
        ("memory usage approaching maximum limit",               "Performance Warning"),
        ("request queue growing response degraded",              "Performance Warning"),
        ("garbage collection pause time too long",               "Performance Warning"),
        ("database query taking longer than expected",           "Performance Warning"),
        ("api latency increased by 200 percent",                 "Performance Warning"),
        ("disk io wait time exceeding threshold",                "Performance Warning"),
        ("connection pool near capacity",                        "Performance Warning"),
        ("service response time degraded significantly",         "Performance Warning"),
        ("thread count approaching system limit",                "Performance Warning"),
        ("cache hit rate dropped below threshold",               "Performance Warning"),
        ("event loop lag detected in node process",              "Performance Warning"),
        ("slow query detected execution time 10 seconds",        "Performance Warning"),
        ("throughput dropped below baseline",                    "Performance Warning"),

        # ── Info ──────────────────────────────────────────────────────────────
        ("server started successfully on port 3000",             "Info"),
        ("user registration completed successfully",             "Info"),
        ("scheduled backup completed",                           "Info"),
        ("deployment successful version 2.1.0",                 "Info"),
        ("health check passed all services running",             "Info"),
        ("configuration reloaded successfully",                  "Info"),
        ("new user signed up from web application",              "Info"),
        ("daily report generated and sent",                      "Info"),
        ("cache cleared and rebuilt successfully",               "Info"),
        ("log rotation completed",                               "Info"),
        ("service scaled up to 3 instances",                     "Info"),
        ("ssl certificate renewed successfully",                 "Info"),
        ("database backup exported to cloud storage",            "Info"),
        ("system maintenance window started",                    "Info"),
        ("all queued jobs processed successfully",               "Info"),
    ]

    messages = [log[0] for log in training_logs]
    labels   = [log[1] for log in training_logs]

    model = Pipeline([
        ('tfidf',       TfidfVectorizer(max_features=5000, ngram_range=(1, 2), stop_words='english')),
        ('classifier',  MultinomialNB(alpha=0.1))
    ])
    model.fit(messages, labels)

    model_path = os.path.join(SAVE_DIR, "log_classifier.pkl")
    joblib.dump(model, model_path)
    print(f"  [OK] Saved to {model_path}")

    # Sanity checks
    print("  Test results:")
    test_logs = [
        "database connection timeout error",
        "user failed to login with invalid password",
        "server running normally on port 8080",
        "cpu usage at 95 percent system overloaded",
        "sql injection detected in query parameter"
    ]
    for log in test_logs:
        pred  = model.predict([log])[0]
        prob  = max(model.predict_proba([log])[0])
        print(f"    '{log[:44]}...' -> {pred} ({prob:.2f})")
    print()


# ── Entry Point ──────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  AI DevOps ML Service — Model Training")
    print("=" * 60)
    print()

    train_anomaly_model()
    train_failure_model()
    train_log_classifier()

    print("=" * 60)
    print("  All models trained and saved successfully!")
    print(f"  Location: {os.path.abspath(SAVE_DIR)}")
    print("=" * 60)


if __name__ == "__main__":
    main()