// =================================================== #
// Project: jenkaz
// =================================================== #
import * as core from "@actions/core";

// INFO: Run Function
async function run() {
  try {
    // 1. Define Inputs
    const jenkins_url = core.getInput("jenkins-url");
    const jenkins_user = core.getInput("jenkins-user");
    const jenkins_token = core.getInput("jenkins-token");
    const jenkins_job = core.getInput("jenkins-job");

    // 2. Process System
    console.log(`Jenkins url: ${jenkins_url}`);
    console.log(`Jenkins user: ${jenkins_user}`);
    console.log(`Jenkins token: ${jenkins_token}`);
    console.log(`Jenkins job: ${jenkins_job}`);

    // 3. Generate Output
    core.setOutput("time", new Date().toTimeString());
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
