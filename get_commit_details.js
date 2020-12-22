var nodegit = require("nodegit"),
  path = require("path"),
  Promise = require('promise');



var url = "https://github.com/web-engineering-tuwien/recipe-search-live-demo.git", //in case we want to clone a repo
  local = "/Users/lorianaporumb/Desktop/RecipePuppy" 
  cloneOpts = {};





const { promisify } = require('util');
const exec = promisify(require('child_process').exec)

async function get_first_commit() {
    const first_commit = 'git rev-list --max-parents=0 HEAD'
    const access_repo = `cd ${local}`

    const first_commit_command = await exec(access_repo + " && " + first_commit)
    const first_commit_sha = first_commit_command.stdout

    console.log(first_commit_sha)
    return first_commit_sha
/*
    const repo = await nodegit.Repository.open(local)
    const nodegit_commit = await repo.getCommit(first_commit_sha)
    console.log(nodegit_commit.message())
    */

};


async function get_next_commit(current_sha) {

    const next_commit = `git log --reverse --pretty=%H master | grep -A 1 $(git rev-parse ${current_sha}) | tail -n1`
    const access_repo = `cd ${local}`

    const next_commit_command = await exec(access_repo + " && " + next_commit)
    const next_commit_sha = next_commit_command.stdout

    console.log(next_commit_sha)
    /*const repo = await nodegit.Repository.open(local)
    const nodegit_next_commit = await repo.getCommit(next_commit_sha)
    console.log(nodegit_next_commit.message())*/
}


async function get_diff(commit_sha) {
    const repo = await nodegit.Repository.open(local)
    const commit = await repo.getCommit(commit_sha)
    console.log(commit.message())
    const diff_array = await commit.getDiff()
    console.log(diff_array)
}



async function get_all_commits_sha() {
    const repo = await nodegit.Repository.open(local)
  
    const latest_master_commit = await repo.getMasterCommit()
  
    const commits = await new Promise(function (resolve, reject) {
      var hist = latest_master_commit.history()
      hist.start()
      hist.on("end", resolve);
      hist.on("error", reject);
    });
  
    /**
     * this part here is important in case you want to get the commits in increasing chronological order (oldest first)
     */
    commits.reverse()
  
    for (var i = 0; i < commits.length; i++) {
      //var sha = commits[i].sha().substr(0,7),   for the sha shorthand, but getting a file by sha shorthand doesn't work at the moment
      
      var sha = commits[i].sha(),
        msg = commits[i].message().split('\n')[0]; //will need this later so I'm leaving it in
        
      console.log(sha + " " + msg);
      var diff = await commits[i].getDiff()
      console.log(await diff[0].patches())
     
    }
  
  }
  




/*get_first_commit().then(console.log("DOONE"))
get_next_commit("35949ff7dd29c197171339ae6a51389b30787c8f").then(console.log("DOONE"))*/
//get_diff('13a435e480e9ced68a06414d65589d7b2fe90964').then(console.log("DOONE"))
get_all_commits_sha().then(console.log('Done'))