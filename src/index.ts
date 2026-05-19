// =================================================== #
// Project: jenkaz
// =================================================== #
import * as core from "@actions/core";

// INFO: JenkinsJob interface
interface JenkinsJob {
  url: string;
  user: string;
  token: string;
  jobName: string;
  track?: string;
  timeout?: string;

  trigger: (job: JenkinsJob) => Promise<void>;
  trackJob: (job: JenkinsJob) => Promise<void>;
}

interface ActionOutput {
  job_url: string;
  status: string;
}

// INFO: trigger jenkins function
async function trigger_jenkins_job(job: JenkinsJob) {
  console.log(`trigger jenkins job: ${job.jobName}`);
  console.log(`trigger jenkins job: ${job.url}`);
  console.log(`trigger jenkins job: ${job.user}`);
  console.log(`trigger jenkins job: ${job.token}`);
  console.log(`trigger jenkins job: ${job.track || "None"}`);
  console.log(`trigger jenkins job: ${job.timeout || "None"}`);
}

// INFO: track jenkins jobs
async function track_jenkins_job(job: JenkinsJob) {
  console.log(`trigger jenkins job: ${job.jobName}`);
  console.log(`trigger jenkins job: ${job.url}`);
  console.log(`trigger jenkins job: ${job.user}`);
  console.log(`trigger jenkins job: ${job.token}`);
  console.log(`trigger jenkins job: ${job.track || "None"}`);
  console.log(`trigger jenkins job: ${job.timeout || "None"}`);
}

// INFO: Run Function
async function run() {
  const output: ActionOutput = {
    job_url: "",
    status: "fail",
  };

  try {
    // 1. Define Inputs
    const job: JenkinsJob = {
      url: core.getInput("jenkins-url"),
      user: core.getInput("jenkins-user"),
      token: core.getInput("jenkins-token"),
      jobName: core.getInput("jenkins-job"),
      track: core.getInput("jenkins-track"),
      timeout: core.getInput("jenkins-timeout"),

      trigger: trigger_jenkins_job,
      trackJob: track_jenkins_job,
    };

    // 2. trigger jenkins job
    await job.trigger(job);

    // 3. track jenkins job if configured 'track' mode
    if (job.track == "true") {
      await job.trackJob(job);
    }

    output.status = "success";
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  } finally {
    core.setOutput("job_url", output.job_url);
    core.setOutput("status", output.status);
  }
}

run();
