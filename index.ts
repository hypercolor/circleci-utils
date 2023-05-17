import {spawn} from "child_process";

const exec = require('util').promisify(require('child_process').exec);

const runCmd = async(cmd: string) => {
  const {stdout} = await exec(cmd);
  return stdout.trim();
}

const spawnCmd = async(cmd: string) => {
  const cmdParts = cmd.split(' ');
  let p = spawn(cmdParts[0], cmdParts.slice(1));
  return new Promise((resolve) => {
    p.stdout.on("data", (x) => process.stdout.write(x.toString()));
    p.stderr.on("data", (x) => process.stderr.write(x.toString()));
    p.on("exit", (code) => {
      resolve(code);
    });
  });
}

export class CiUtils {

  public static async getTagForProcess(processTag: string) {

    const gitHash = (await runCmd('git rev-parse HEAD')).substring(0,8);
    return `${gitHash}_${processTag}`;
  }

  public static async refreshEcrToken(region: string, accountId: string) {
    // refresh ECR token
    await runCmd(`docker login --username AWS --password \$(aws ecr get-login-password --region ${region}) ${accountId}.dkr.ecr.${region}.amazonaws.com`);
  }

  public static async checkIfTagExists(tag: string) {
    let result;
    try {
      result = await runCmd(`aws ecr describe-images --repository-name abuzz --image-ids imageTag=${tag}`);
      return true;
    } catch (err: any) {
      if (err?.message?.includes('ImageNotFoundException')) {
        return false;
      } else {
        console.log('Error checking tag: ', err);
        throw err;
      }
    }
  }

  public static async buildProcess(processTag: string, deployTag: string) {
    try {
      const cmd = `docker build --progress=plain -t ${deployTag} -f Dockerfile.${processTag} .`;
      console.log('Building Docker container: ', cmd);
      await spawnCmd(cmd);
      console.log('Build complete');
    } catch (err) {
      console.log('Error building process', processTag, err);
      throw err;
    }
  }

  public static async pushTag(tag: string) {
    try {
      console.log('pushing tag: ', tag);
      await runCmd(`docker push ${tag}`);
      console.log('Push complete');
    } catch (err: any) {
      if (err?.message?.includes('cannot be overwritten because the repository is immutable')) {
        console.log('Tag already exists, ignoring error');
        return;
      }
      console.log('Error pushing tag', tag, err);
      throw err;
    }
  }



}








