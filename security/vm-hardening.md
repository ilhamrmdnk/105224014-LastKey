# VM Hardening — LastKey Security Milestone

## 1. Overview

This document describes the Virtual Machine (VM) hardening process performed as part of the LastKey Cyber Security milestone (sec-0.2).

The objective is to improve the security posture of the Ubuntu Server environment by implementing SSH hardening, firewall configuration, intrusion prevention, system auditing, and security assessment using Lynis.

## 2. Environment


| Component | Configuration |
|---|---|
| Host OS | Linux Mint 22.3 Zena |
| Virtualization | Oracle VirtualBox 7.2.22 |
| Guest OS | Ubuntu Server 24.04.5 LTS |
| VM Name | Ubuntu-Server-Hardening |
| VM RAM | 1000 MB |
| CPU | 1 vCPU |
| Network | NAT |
| SSH Host Port | 2222 |
| SSH Guest Port | 22 |

All hardening configurations described in this document were applied inside the Ubuntu Server guest VM, not on the Linux Mint host.

## 3. SSH Hardening

SSH was configured to use public-key authentication and reject password-based login.

### Security Configuration

| Setting | Value |
|---|---|
| PermitRootLogin | no |
| PubkeyAuthentication | yes |
| PasswordAuthentication | no |
| KbdInteractiveAuthentication | no |
| MaxAuthTries | 3 |
| MaxSessions | 2 |
| ClientAliveCountMax | 2 |
| X11Forwarding | no |
| TCPKeepAlive | no |
| AllowTcpForwarding | yes |
| AllowAgentForwarding | no |

`AllowTcpForwarding` remains enabled to support SSH tunneling when required.

### Verification

- SSH key-based login from the host was successful.
- Password-only authentication was rejected.
- SSH service configuration passed `sshd -t`.
- SSH service restarted successfully.

## 4. Firewall Configuration

UFW (Uncomplicated Firewall) was configured to restrict incoming network traffic.

| Rule | Configuration |
|---|---|
| Default incoming | Deny |
| Default outgoing | Allow |
| SSH | Allow TCP port 22 |
| Firewall status | Active |

The firewall allows SSH access while denying other unsolicited incoming connections.

## 5. Fail2ban

Fail2ban was installed and enabled to help protect SSH against repeated failed login attempts.

| Parameter | Value |
|---|---|
| Service | Active |
| Jail | sshd |
| Max retry | 5 |
| Find time | 600 seconds |
| Ban time | 600 seconds |

The SSH jail was verified using `fail2ban-client status`.

## 6. System Auditing with auditd

The auditd service was installed and enabled to monitor important system configuration files.

The following audit rules were configured:

```text
-w /etc/passwd -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k scope
-w /etc/ssh/sshd_config -p wa -k ssh_config
-w /etc/ufw/ -p wa -k firewall
```

These rules monitor write and attribute changes to important identity, privilege, SSH, and firewall configuration files.

## 7. Lynis Security Assessment

Lynis was used to assess the security configuration before and after hardening.

### Hardening Index Progress

| Stage | Hardening Index |
|---|---:|
| Initial baseline | 62 |
| SSH and UFW | 65 |
| Fail2ban | 66 |
| auditd and audit rules | 67 |
| Final hardening | 71 |

### Final Assessment

| Metric | Result |
|---|---:|
| Hardening Index | 71 |
| Tests Performed | 255 |
| Suggestions | 39 |
| Audit Warnings | 0 |

The final Lynis assessment achieved a hardening index of 71, exceeding the target score of 70. No audit warnings were reported.

The remaining suggestions are treated as further security improvement opportunities and were not all applied because of the VM's limited resources and the project's requirements.

## 8. Evidence

Raw evidence is stored in:

`security/evidence/vm-hardening/`

| File | Description |
|---|---|
| `lynis-report-final.dat` | Final Lynis report |
| `lynis-log-final.txt` | Final Lynis execution log |
| `vm-hardening-final.txt` | VM security configuration summary |

## 9. Conclusion

The Ubuntu Server VM hardening process successfully implemented SSH key-only authentication, UFW firewall rules, Fail2ban, and auditd monitoring.

The final Lynis hardening index reached 71 with zero audit warnings, meeting the project's target of at least 70.

These configurations improve the security posture of the VM used in the LastKey project.