#!/usr/bin/env node
const chalk = require("chalk");
const figlet = require("figlet");
const Minimist = require("minimist");
const { Octokit } = require("@octokit/rest");
const settings = require("settings-store");
const { program } = require("commander");
const simpleGit = require('simple-git');

var pkginfo = require("pkginfo")(module);
const conf = require("rc-house")("git-cloner", {
    // defaults
    githubAPIKey: null,
    gheAPIKey: null,
    gheHost: null,
});

let octokit = null;

if (settings.value("github", "public") === "public") {
    octokit = new Octokit({
        auth: conf.githubAPIKey,
        userAgent: "octokit/rest.js v1.2.3",
        log: {
            warn: console.warn,
            error: console.error,
        },
    });
} else {
    octokit = new Octokit({
        auth: conf.githubAPIKey,
        userAgent: "octokit/rest.js v1.2.3",
        log: {
            warn: console.warn,
            error: console.error,
        },
    });
}

program
    .name("git-cloner")
    .description("CLI for cloning an entire github org locally")
    .version(pkginfo.version);

program
    .command("clone")
    .description("Clone all repos locally")
    .option("-o, --org <char>", "The org to list repositories in")
    .action((options) => {
        cloneRepos(octokit, options.org)
    });

program.parse();


async function cloneRepos(octokit, org) {
    if (org == null || org === "user") {
        console.log(chalk.green("Your Repositories:"));
        const userreposoptions = await octokit.repos.list.endpoint.merge({
            type: "owner",
        });

        for await (const response of octokit.paginate.iterator(userreposoptions)) {
            // do whatever you want with each response, break out of the loop, etc.
            for (let index = 0; index < response.data.length; index++) {
                console.log(chalk.yellow(response.data[index].name));
                //console.dir(response.data[index])
                const remote = `git@github.com:${response.data[index].full_name}.git`
                console.log(`Cloning: ${remote}`)
                await simpleGit()
                    .clone(remote)
                    .then(() => console.log('Cloned'))
                    .catch((err) => console.error('Clone failed', err))
            }
        }
    } else {
        console.log(chalk.green(org + " Repositories:"));
        const repos = await octokit.repos.listForOrg({
            org: org,
        });
        if (repos != null && repos.data != null) {
            for (let index = 0; index < repos.data.length; index++) {
                console.log(chalk.yellow(repos.data[index].name));
            }
        }
    }
}
