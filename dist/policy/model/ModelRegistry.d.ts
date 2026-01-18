import { ModelCapabilities } from '../../core/modelMatcher';
import { ModelSpec } from '../token/types';
/**
 * ModelRegistry - 模型规格注册表
 *
 * 将现有的 ModelCapabilities 扩展为 ModelSpec，
 * 提供统一的模型信息查询接口。
 */
export declare class ModelRegistry {
    private models;
    constructor(baseCapabilities: ModelCapabilities[]);
    /**
     * 注册模型规格
     */
    private register;
    /**
     * 根据名称获取模型规格
     */
    get(name: string): ModelSpec | undefined;
    /**
     * 获取默认模型
     */
    getDefault(): ModelSpec;
    /**
     * 查找所有支持长文本的模型
     * 按上下文窗口大小降序排列
     */
    findLongContextCapable(): ModelSpec[];
    /**
     * 查找最佳长文本模型
     * 返回上下文窗口最大的模型
     */
    findBestLongContextModel(): ModelSpec | undefined;
    /**
     * 列出所有已注册的模型
     */
    listModels(): ModelSpec[];
}
