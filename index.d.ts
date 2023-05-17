export declare class CiUtils {
    static getTagForProcess(processTag: string): Promise<string>;
    static refreshEcrToken(region: string, accountId: string): Promise<void>;
    static checkIfTagExists(tag: string): Promise<boolean>;
    static buildProcess(processTag: string, deployTag: string): Promise<void>;
    static pushTag(tag: string): Promise<void>;
}
