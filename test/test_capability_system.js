#!/usr/bin/env node

// 测试CapabilitySystem中的模型去重
const fs = require("fs");
const path = require("path");

// 动态导入必要的模块
const { CapabilitySystem } = require("../dist/core/capabilitySystem");

console.log("🧪 测试 CapabilitySystem 中的模型配置...\\n");

const capabilitySystem = new CapabilitySystem();

// 获取所有模型
const allModels = capabilitySystem.getAllModels();
console.log("📊 系统中可用的模型总数:", allModels.length);
console.log("");

// 检查重复模型
const modelIdentifiers = allModels.map(m => `\${m.name} (\${m.provider})`);
const uniqueModels = new Set(modelIdentifiers);
console.log("是否有重复模型:", modelIdentifiers.length !== uniqueModels.size);
console.log("");

if (modelIdentifiers.length !== uniqueModels.size) {
  console.log("🔍 重复的模型:");
  const counts = {};
  modelIdentifiers.forEach(id => {
    counts[id] = (counts[id] || 0) + 1;
  });
  Object.entries(counts).forEach(([id, count]) => {
    if (count > 1) {
      console.log(\`  🚨 \${id}: \${count} 次\`);
        }
    });
    console.log("");
}

// 显示所有模型
allModels.forEach((model, index) => {
    console.log(\`\${index + 1}. \${model.name} (\${model.provider})\`);
    console.log(\`   能力: \${model.atomicCapabilities.join(", ")}\`);
    console.log(\`   上下文窗口: \${model.contextWindow}\`);
    console.log(\`   成本等级: \${model.costProfile}\`);
    console.log("");
});

// 测试能力匹配
console.log("🔍 测试能力匹配功能...");

const { AtomicCapability } = require("./dist/core/capabilities");

const testCases = [
  {
    name: "通用任务",
    requirement: {
      required: [AtomicCapability.TEXT_GENERATION, AtomicCapability.REASONING],
      preferred: []
    }
  },
  {
    name: "代码生成任务",
    requirement: {
      required: [AtomicCapability.CODE_GENERATION, AtomicCapability.REASONING],
      preferred: []
    }
  },
  {
    name: "长上下文任务",
    requirement: {
      required: [AtomicCapability.LONG_CONTEXT, AtomicCapability.REASONING],
      preferred: []
    }
  }
];

testCases.forEach((testCase, index) => {
  console.log(\`\\n📋 测试 \${index + 1}: \${testCase.name}\`);
  try {
    const result = capabilitySystem.matchCapability(testCase.requirement);
    if (result.selected) {
      console.log(\`  ✅ 选中模型: \${result.selected.name} (\${result.selected.provider})\`);
      console.log(\`  🔄 Fallback: \${result.fallbackOccurred ? "是" : "否"}\`);
    } else {
      console.log("  ❌ 未找到满足条件的模型");
    }
    console.log(\`  候选模型数量: \${result.candidates.length}\`);
  } catch (error) {
    console.log(\`  ❌ 错误: \${error.message}\`);
  }
});

console.log("\\n✅ CapabilitySystem 模型配置测试完成！");

