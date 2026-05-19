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
  wait?: string;
  track?: string;
  timeout?: string;

  trigger: (job: JenkinsJob) => Promise<void>;
  trackJob: (job: JenkinsJob) => Promise<void>;
}

// INFO: ActionOutput interface
interface ActionOutput {
  job_url: string;
  status: string;
}

// INFO: helper to define the sleep interval between checks
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// INFO: helper to fetch the status for job
const fetchJobStatus = async (job: JenkinsJob): Promise<string> => {
  console.log(`Job url: ${job.jobName}`);
  return "RUNNING";
};

// INFO: helper function to trigger the job
const triggerJob = async (job: JenkinsJob): Promise<void> => {
  const waitTime = parseInt(job.wait || "1000", 10);
  console.log(`Job Will Trigger after ${waitTime}`);
  sleep(waitTime);
  console.log(`Job url: ${job.jobName}`);
};

// INFO: trigger jenkins function
async function trigger_jenkins_job(job: JenkinsJob) {
  console.log(`trigger jenkins job: ${job.jobName}`);
  console.log(`trigger jenkins job: ${job.url}`);
  console.log(`trigger jenkins job: ${job.user}`);
  console.log(`trigger jenkins job: ${job.token}`);
  console.log(`trigger jenkins job: ${job.track || "None"}`);
  console.log(`trigger jenkins job: ${job.timeout || "None"}`);
  triggerJob(job);
}

// INFO: track jenkins jobs
async function track_jenkins_job(job: JenkinsJob) {
  console.log(`trigger jenkins job: ${job.jobName}`);
  console.log(`trigger jenkins job: ${job.url}`);
  console.log(`trigger jenkins job: ${job.user}`);
  console.log(`trigger jenkins job: ${job.token}`);
  console.log(`trigger jenkins job: ${job.track}`);
  console.log(`trigger jenkins job: ${job.timeout}`);

  const totalTimeOut = parseInt(job.timeout || "1000", 10);
  const checkInterval = totalTimeOut / 5;

  for (let i = 0; i < 5; i++) {
    await sleep(checkInterval);
    console.log(`=> Checking status for job :${job.jobName} (Check ${i} / 5)`);
    const currentStatus = await fetchJobStatus(job);
    if (currentStatus == "SUCCESS") {
      console.log("Job Finished With Success :)");
      return;
    } else if (currentStatus == "FAILURE") {
      console.log("Job Finished With Failed :(");
      return;
    } else if (currentStatus == "RUNNING" && i == 4) {
      // TEST: Only Test The Success Case
      console.log("Simulate Success");
      return;
    }
  }
  console.log(`=> Time reaced for job: ${job.jobName}`);
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
    core.startGroup("Trigger Jenkins Job");
    await job.trigger(job);
    core.endGroup();
    // 3. track jenkins job if configured 'track' mode
    if (job.track === "true") {
      core.startGroup("Tracking Jenkins Job Execution");
      await job.trackJob(job);
      core.endGroup();
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
