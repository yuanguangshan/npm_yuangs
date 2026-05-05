# SECURITY.md - AI Governance Safety Policy

## 🛡️ AI Governance Philosophy

Yuangs is built on the principle of **Developer Sovereignty**. Unlike "black-box" AI tools, Yuangs ensures that no command is executed without explicit human understanding and consent. The Web-based CLI further enhances this by providing visual "Hard Intercepts."

## 🚫 The "Zero-Transmission" Command List

The following patterns are **Hard-Coded** into the local Governance Engine. These commands are intercepted **at the source (on your local machine)** and are NEVER transmitted to the remote server over the SSH tunnel:

1.  **Root Filesystem Destruction**: 
    - `rm -rf /`
    - `rm -rf /*`
2.  **Filesystem Formatting**:
    - `mkfs.*` (e.g., `mkfs.ext4`, `mkfs.xfs`)
3.  **Direct Block Device Overwrite**:
    - `dd if=... of=/dev/sd*`
    - `dd if=... of=/dev/nvme*`
4.  **Fork Bombs (Denial of Service)**:
    - `:(){ :|:& };:`

## 🧠 Governance Tiers

| Tier | Mechanism | Action |
| :--- | :--- | :--- |
| **Tier 1: Static Intercept** | Local Regex (Hard-coded) | **Instant Block**. Command never leaves your machine. |
| **Tier 2: AI Evaluation** | Semantic analysis (LLM) | **Prompt for Confirmation**. AI explains the risk; you decide. |
| **Tier 3: Post-Exec Audit** | Session Recording (.cast) | **Auditable Trail**. Every action is logged for forensic review. |

## 📦 Security Reporting

If you find a bypass in the governance engine, please report it via GitHub Issues or contact the maintainer directly. Our goal is to make the "Guardrail" impenetrable without hindering administrative tasks.

---

> **"Power is nothing without control."**
