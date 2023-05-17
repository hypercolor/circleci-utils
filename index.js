"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CiUtils = void 0;
const child_process_1 = require("child_process");
const exec = require('util').promisify(require('child_process').exec);
const runCmd = async (cmd) => {
    const { stdout } = await exec(cmd);
    return stdout.trim();
};
const spawnCmd = async (cmd) => {
    const cmdParts = cmd.split(' ');
    let p = (0, child_process_1.spawn)(cmdParts[0], cmdParts.slice(1));
    return new Promise((resolve) => {
        p.stdout.on("data", (x) => process.stdout.write(x.toString()));
        p.stderr.on("data", (x) => process.stderr.write(x.toString()));
        p.on("exit", (code) => {
            resolve(code);
        });
    });
};
class CiUtils {
    static async getTagForProcess(processTag) {
        const gitHash = (await runCmd('git rev-parse HEAD')).substring(0, 8);
        return `${gitHash}_${processTag}`;
    }
    static async refreshEcrToken(region, accountId) {
        // refresh ECR token
        await runCmd(`docker login --username AWS --password \$(aws ecr get-login-password --region ${region}) ${accountId}.dkr.ecr.${region}.amazonaws.com`);
    }
    static async checkIfTagExists(tag) {
        var _a;
        let result;
        try {
            result = await runCmd(`aws ecr describe-images --repository-name abuzz --image-ids imageTag=${tag}`);
            return true;
        }
        catch (err) {
            if ((_a = err === null || err === void 0 ? void 0 : err.message) === null || _a === void 0 ? void 0 : _a.includes('ImageNotFoundException')) {
                return false;
            }
            else {
                console.log('Error checking tag: ', err);
                throw err;
            }
        }
    }
    static async buildProcess(processTag, deployTag) {
        try {
            const cmd = `docker build --progress=plain -t ${deployTag} -f Dockerfile.${processTag} .`;
            console.log('Building Docker container: ', cmd);
            await spawnCmd(cmd);
            console.log('Build complete');
        }
        catch (err) {
            console.log('Error building process', processTag, err);
            throw err;
        }
    }
    static async pushTag(tag) {
        var _a;
        try {
            console.log('pushing tag: ', tag);
            await runCmd(`docker push ${tag}`);
            console.log('Push complete');
        }
        catch (err) {
            if ((_a = err === null || err === void 0 ? void 0 : err.message) === null || _a === void 0 ? void 0 : _a.includes('cannot be overwritten because the repository is immutable')) {
                console.log('Tag already exists, ignoring error');
                return;
            }
            console.log('Error pushing tag', tag, err);
            throw err;
        }
    }
}
exports.CiUtils = CiUtils;
//# sourceMappingURL=index.js.map