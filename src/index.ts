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

  // create a get request to find the job status
  let response = await axios.get(statusUrl, {
    auth: {
      username: job.user,
      password: job.token,
    },
  });
  let inProgress = response.data.inProgress;
  console.log(
    `[Track] Current InProgress Status: ${inProgress} And Current Job Start ${job.start}`,
  );

  // initial wait until new build start
  console.log(`Con: ${inProgress === false} && ${job.start === 0}`);
  while (inProgress === false && job.start === 0) {
    console.log("[Track] Wait Until New Build Start");
    response = await axios.get(statusUrl, {
      auth: {
        username: job.user,
        password: job.token,
      },
    });
    inProgress = response.data.inProgress;
    if (inProgress === "true") {
      job.start = 1;
    }
  }

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

// INFO: getCircularReplacer Function
// const getCircularReplacer = () => {
//   const seen = new WeakSet();
//   return (_: string, value: any) => {
//     if (typeof value === "object" && value != null) {
//       if (seen.has(value)) {
//         return "[Circular]";
//       }
//       seen.add(value);
//     }
//     return value;
//   };
// };

// INFO: helper function to trigger the job
const triggerJob = async (job: JenkinsJob): Promise<string> => {
  // 1. Build Wait Time
  const waitTime = parseInt(job.wait || "1000", 10);
  console.log(`[Trigger]Job Will Trigger after ${waitTime}`);
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

    // TEST: Print Logging for Extract the Build Number For Track it
    // console.log(`Trigger remote jenkins job at ${triggerUrl}`);
    // console.log(`Trigger remote with ${job.user} and ${job.token}`);
    // console.log(
    //   `[Trigger] Response : ${JSON.stringify(response, getCircularReplacer())}`,
    //   2,
    // );

    // check is job trigger correctly
    if (response.status === 201 || response.status === 200) {
      console.log("Build trigger successfully!");
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

  const timeInterval = parseInt(job.timeout || "100", 10);
  const waitTime = parseInt(job.wait || "100000", 10);

  // initial wait before start tracking
  sleep(waitTime + 10000);

  // start tracking job
  let counter = 1;
  while (true) {
    await sleep(500);
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
