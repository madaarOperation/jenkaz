// =================================================== #
// Project: jenkaz
// =================================================== #
import * as core from "@actions/core";
import axios from "axios";

// INFO: JenkinsJob interface
interface JenkinsJob {
  url: string;
  user: string;
  token: string;
  jobToken: string;
  jobName: string;
  wait?: string;
  track?: string;
  timeout?: string;
  start: number;

  trigger: (job: JenkinsJob) => Promise<string>;
  trackJob: (job: JenkinsJob) => Promise<string>;
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
  console.log(`[Fetch] Job url: ${job.jobName}`);
  let status = "RUNNING";
  const statusUrl = `${job.url}/${job.jobName}/lastBuild/api/json`;

  let response = await axios.get(statusUrl, {
    auth: {
      username: job.user,
      password: job.token,
    },
  });
  let inProgress = response.data.inProgress;

  do {
    response = await axios.get(statusUrl, {
      auth: {
        username: job.user,
        password: job.token,
      },
    });
    inProgress = response.data.inProgress;
    if (inProgress === true) {
      job.start = 1;
    }
  } while (inProgress == false && job.start == 0);

  let url = response.data.url;
  let result = response.data.result;
  console.log(`[Track] URL: ${url}`);

  // update `status` value
  if (result === "SUCCESS") {
    console.log("[Fetch] Successfully Deploy New Version Of Project");
    status = "SUCCESS";
  } else if (result === "FAILURE" || result === "ABORTED") {
    console.log("[Fetch] Error Happen When Try To Deploy New Version");
    status = "FAILURE";
  }

  return status;
};

// INFO: helper function to trigger the job
const triggerJob = async (job: JenkinsJob): Promise<string> => {
  // 1. Build Wait Time
  const waitTime = parseInt(job.wait || "1000", 10);
  console.log(`[Trigger] Job Will Trigger after ${waitTime}`);
  sleep(waitTime);

  // 2. Trigger Jenkins Job
  try {
    const triggerUrl = `${job.url}/${job.jobName}/buildWithParameters?token=${job.jobToken}`;
    const response = await axios.post(triggerUrl, null, {
      auth: {
        username: job.user,
        password: job.token,
      },
    });

    // check is job trigger correctly
    if (response.status === 201 || response.status === 200) {
      console.log("[Trigger] Trigger Done successfully!");
      return "SUCCESS";
    }
    return "FAILURE";
  } catch (error) {
    // check the type of error
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        `API Error ${error.response.status}: `,
        error.response.data,
      );
    } else {
      console.error(`General Error`, error);
    }

    return "FAILURE";
  }
};

// INFO: trigger jenkins function
async function trigger_jenkins_job(job: JenkinsJob): Promise<string> {
  console.log("[Trigger] Start Trigger Jenkins Job ");
  return triggerJob(job);
}

// INFO: track jenkins jobs
async function track_jenkins_job(job: JenkinsJob): Promise<string> {
  console.log("[Track] Start Track Jenkins Job");

  const timeInterval = parseInt(job.timeout || "100000") / 10;
  const waitTime = parseInt(job.wait || "100000");

  // initial wait before start tracking
  sleep(waitTime + 10000);

  // start tracking job
  let counter = 1;
  while (true) {
    await sleep(1000); // fixed delay between check 1 sec can make it configurable
    console.log(
      `=> Checking status for job :${job.jobName} (Check ${counter} / ${timeInterval})`,
    );

    const currentStatus = await fetchJobStatus(job);

    // check the timeout
    if (counter >= timeInterval) {
      console.log("Hit Timeout!");
      return "TIMEOUT";
    }

    // check the status for result
    if (currentStatus == "SUCCESS") {
      console.log("Job Finished With Success :)");
      return currentStatus;
    } else if (currentStatus == "FAILURE") {
      console.log("Job Finished With Failed :(");
      return currentStatus;
    }

    counter++;
  }
}

// INFO: Run Function
async function run() {
  const output: ActionOutput = {
    job_url: "",
    status: "FAILURE",
  };

  try {
    // 1. Define Inputs
    const job: JenkinsJob = {
      url: core.getInput("jenkins-url"),
      user: core.getInput("jenkins-user"),
      token: core.getInput("jenkins-token"),
      jobName: core.getInput("jenkins-job-path"),
      jobToken: core.getInput("jenkins-job-token"),
      track: core.getInput("jenkins-track"),
      timeout: core.getInput("jenkins-timeout"),
      start: 0,

      trigger: trigger_jenkins_job,
      trackJob: track_jenkins_job,
    };

    // 2. trigger jenkins job
    core.startGroup("Trigger Jenkins Job");
    output.status = await job.trigger(job);
    core.endGroup();

    // 3. track jenkins job if configured 'track' mode
    if (job.track === "true" && output.status === "SUCCESS") {
      core.startGroup("Tracking Jenkins Job Execution");
      output.status = await job.trackJob(job);
      core.endGroup();
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  } finally {
    core.setOutput("job_url", output.job_url);
    core.setOutput("status", output.status);
  }
}

run();
