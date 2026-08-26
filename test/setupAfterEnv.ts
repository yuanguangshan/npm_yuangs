/**
 * 全局测试清理：防止单例状态泄漏到下一用例
 */
import { resetRouterIntegration } from '../src/agent/modelRouterIntegration';
import { WasmGovernanceBridge } from '../src/agent/governance/bridge';
import { GovernanceService } from '../src/agent/governance';
import { Logger } from '../src/utils/Logger';

afterEach(() => {
  try { resetRouterIntegration(); } catch {}
  try { WasmGovernanceBridge.resetForTesting(); } catch {}
  try { GovernanceService.resetForTesting(); } catch {}
  try { Logger.resetForTesting(); } catch {}
});
