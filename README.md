# Edge-With-Your-Own-Agent (EYOA)

> **Navigation / 目录索引**
> * [English Version](#english-version)
> * [中文版本](#chinese-version)

---

<h2 id="english-version">English Version</h2>

### 1. Abstract
The **Edge-With-Your-Own-Agent (EYOA)** repository proposes a robust, decentralized framework designed to facilitate the deployment and orchestration of customized autonomous agents within edge computing paradigms. By transitioning inference and reasoning workloads from centralized cloud architectures to localized edge nodes, this project mitigates inherent constraints related to latency, data privacy, and bandwidth utilization.

### 2. System Architecture
The framework is engineered to optimize heterogeneous resource allocation, ensuring that user-defined computational agents can operate autonomously with minimal overhead. The architectural topology includes:
*   **Decentralized Node Orchestration:** Utilizes lightweight consensus mechanisms to manage agent state and task distribution across discrete edge devices.
*   **Asynchronous Communication Protocol:** Implements non-blocking, event-driven telemetry to synchronize agent sub-routines without saturating local network bandwidth.
*   **Resource-Aware Execution Environment:** Dynamically scales context windows and computational graphs based on the hardware constraints of the hosting edge node.

### 3. Prerequisites
To deploy the EYOA framework, the target environment must satisfy the following dependencies:
*   POSIX-compliant operating system (e.g., modern Linux distributions)
*   Python $\ge$ 3.9 (with standard virtual environment support)
*   Containerization daemon (Docker Engine or equivalent lightweight runtime)

### 4. Deployment Protocol
The initialization sequence involves establishing the localized runtime and binding the user-defined agent parameters. 

```bash
# 1. Clone the repository
git clone https://github.com/rizzogiuseppe871/edge-with-your-own-agent.git
cd edge-with-your-own-agent

# 2. Instantiate the isolated environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Resolve dependencies
pip install -r requirements.txt

# 4. Execute the edge initialization script
python core_init.py --agent-config path/to/your_agent.json
```

### 5. License & Citation
This software is distributed under the MIT License. Should this framework assist in your academic research or institutional projects, proper attribution is expected.

---

<h2 id="chinese-version">中文版本</h2>

### 1. 摘要
**Edge-With-Your-Own-Agent (EYOA)** 仓库提出了一种稳健的去中心化框架，旨在促进自定义自主智能体在边缘计算范式中的部署与编排。通过将推理计算工作负载从中心化的云架构迁移至本地边缘节点，本项目有效缓解了大规模智能体部署中固有的延迟、数据隐私及带宽利用率限制。

### 2. 系统架构
该框架经过深度工程优化，能够高效分配异构资源，确保用户定义的计算智能体在极低开销下自主运行。其架构拓扑包含以下核心组件：
*   **去中心化节点编排：** 利用轻量级共识机制管理智能体状态，并在离散的边缘设备间进行任务分发。
*   **异步通信协议：** 部署非阻塞式、事件驱动的遥测技术，同步智能体子程序，避免本地网络带宽饱和。
*   **资源感知执行环境：** 依据宿主边缘节点的硬件约束，动态缩放上下文窗口与计算图。

### 3. 前置要求
为部署 EYOA 框架，目标环境必须满足以下依赖条件：
*   兼容 POSIX 标准的操作系统（如主流 Linux 发行版）
*   Python $\ge$ 3.9（支持标准虚拟环境）
*   容器化守护进程（Docker Engine 或同等轻量级运行时）

### 4. 部署协议
初始化序列涵盖建立本地运行时以及绑定用户自定义的智能体参数。

```bash
# 1. 克隆仓库
git clone https://github.com/rizzogiuseppe871/edge-with-your-own-agent.git
cd edge-with-your-own-agent

# 2. 实例化隔离环境
python3 -m venv .venv
source .venv/bin/activate

# 3. 解析系统依赖
pip install -r requirements.txt

# 4. 执行边缘初始化脚本
python core_init.py --agent-config path/to/your_agent.json
```

### 5. 许可证与学术引用
本软件遵循 MIT 许可证发布。若此框架对您的学术研究或机构级项目有所助益，敬请在相关文献中予以规范引用。
