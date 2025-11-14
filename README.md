# 🌐 Net Observation Project  
### Global Internet Exposure & Security Observation Research  
**Author:** Nicholas Tritsaris  
**Status:** Active • Non-Commercial Research  
**Datasets:** Censys Universal Internet Dataset • IPv4 Historical • X.509 Certificates  

---

<p align="center">
  <img src="https://img.shields.io/badge/Research-Active-brightgreen?style=for-the-badge">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge">
  <img src="https://img.shields.io/badge/Data-Censys-orange?style=for-the-badge">
  <img src="https://img.shields.io/badge/Python-3.10+-yellow?style=for-the-badge">
</p>

<p align="center">
  <b>Non-commercial cybersecurity research analyzing global internet exposure using Censys datasets.</b>
</p>

---

# 📑 Table of Contents
- [📌 Overview](#-overview)
- [🎯 Objectives](#-objectives)
- [📊 Features](#-features)
- [🧠 Methodology](#-methodology)
- [📁 Repository Structure](#-repository-structure)
- [📡 Datasets Used](#-datasets-used)
- [📥 Installation](#-installation)
- [⚙️ Usage](#️-usage)
- [📈 Example Outputs](#-example-outputs)
- [🛣️ Roadmap](#️-roadmap)
- [📚 Citation](#-citation)
- [📄 License](#-license)
- [🔗 Links](#-links)

---

# 📌 Overview
The **Net Observation Project** is an open, non-commercial cybersecurity research project investigating:

- Global internet-facing services  
- Exposure patterns  
- Misconfigurations  
- Certificate deployments  
- Cryptographic hygiene  
- Trends across IPv4 and IPv6 hosts  

The research uses datasets from **Censys**, one of the largest Internet scanning platforms.

👉 All findings and scripts are **fully open-source**, ensuring transparency and community value.

---

# 🎯 Objectives
- Measure the state of the public internet  
- Identify insecure or outdated deployments  
- Track global service trends  
- Analyze certificate authority behavior  
- Produce actionable insights to support netsec research  

---

# 📊 Features
✔ IPv4/IPv6 Exposure Analysis  
✔ Service Enumeration  
✔ Certificate Analysis  
✔ Misconfiguration Detection  
✔ Data Fetching Scripts  
✔ JSON, CSV & visual output  
✔ Full documentation  
✔ Fully open-source  

---

# 🧠 Methodology
The project uses:

- Censys **Search API**  
- Censys **BigQuery Dataset** (optional)  
- Python-based analysis  
- Statistical aggregation  
- Visual plots for summaries  
- Public publication of findings  

Full details available in `/docs/methodology.md`.

---

# 📁 Repository Structure

```
net-observation-project/
│
├── README.md
├── LICENSE
│
├── scripts/
│   ├── fetch_ipv4_data.py
│   ├── fetch_cert_data.py
│   ├── analyze_services.py
│   ├── analyze_certificates.py
│   └── utils.py
│
├── docs/
│   ├── methodology.md
│   ├── datasets.md
│   ├── results.md
│   └── citations.md
│
└── visuals/
    └── (graphs will be added here)
```

---

# 📡 Datasets Used
### **From Censys:**
- **Universal Internet Dataset**  
- **IPv4 Historical Scan Dataset**  
- **Certificate (X.509) Dataset**  

All data is slightly delayed unless real-time access is approved.

---

# 📥 Installation

### **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/net-observation-project.git
cd net-observation-project
```

### **Install dependencies**
```bash
pip install -r requirements.txt
```

*(If you want, I can generate a `requirements.txt` too.)*

---

# ⚙️ Usage

### Fetch IPv4 exposure data
```bash
python scripts/fetch_ipv4_data.py
```

### Fetch certificate records
```bash
python scripts/fetch_cert_data.py
```

### Analyze exposed services
```bash
python scripts/analyze_services.py
```

### Analyze certificate issuers
```bash
python scripts/analyze_certificates.py
```

---

# 📈 Example Outputs

### 🟦 Top Exposed Services
```
HTTP: 82,341,991
SSH: 24,553,119
RDP: 3,992,002
...
```

### 🔐 Most Common Certificate Issuers
```
Let's Encrypt Authority X3: 2,441,881
Cloudflare ECC CA-3: 1,933,201
...
```

### 🗺️ Geographic Patterns  
*(visual graphs will be added in `/visuals`)*

---

# 🛣️ Roadmap

### 🔜 Coming Soon:
- [ ] BigQuery SQL queries  
- [ ] Global exposure heatmaps  
- [ ] Certificate chain trust modeling  
- [ ] Vulnerability pattern analysis (TLS, SSH, RDP)  
- [ ] Blog article publication  
- [ ] Graphs + dashboards  
- [ ] Automated daily data sync scripts  

---

# 📚 Citation
If citing this project:

```
@misc{tritsaris2025netobs,
  title = {Net Observation Project},
  author = {Nicholas Tritsaris},
  year = {2025},
  howpublished = {\url{https://github.com/YOUR_USERNAME/net-observation-project}}
}
```

To cite Censys:

```
@misc{censys,
  title = {Censys Internet Data},
  year = {2025},
  howpublished = {https://censys.io/}
}
```

---

# 📄 License
This project is licensed under the **MIT License**.  
You are free to use, modify, and distribute this research as long as the license terms are followed.

---

# 🔗 Links
- 🔍 Censys: https://censys.io  
- 📘 Documentation: /docs  
- 📝 Research Blog: *add your Blogger link here*  
- 🐍 Scripts: /scripts  

---

<p align="center">
  <b>Made by Nicholas Tritsaris — Advancing open cybersecurity research.</b>
</p>

