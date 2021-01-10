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

    //get sha of next commit
    const next_commit_command = await exec(access_repo + " && " + next_commit)
    const next_commit_sha = next_commit_command.stdout

    //get message of next commit to check if it should be ignored
    const commit_message = `git log --format=%B -n 1 ${next_commit_sha}`
    const message_command = await exec (access_repo + " && " + commit_message)
    const message = message_command.stdout

    //if the next commit is ignored (aka a theory commit), recursively jump to the next non-ignored one
    if (message.toLowerCase().startsWith("adds event")) { //TODO: replace "adds event with a pattern like "#ignore#""
      return get_next_commit(next_commit_sha)
    } 

    return next_commit_sha
}


async function get_diff(commit_sha) {
    const repo = await nodegit.Repository.open(local)
    const commit = await repo.getCommit(commit_sha)
    console.log(commit.message())
    const diff_array = await commit.getDiff()

    const diff_files = await get_diff_for_files(diff_array)

    /*TODO: return some object here */

    diff_files.forEach(function(file) {
      console.log("============================= NEW FILE =============================")
      console.log(file)
    })
      
}



async function get_diff_for_files(diff_array) {
  var diffFiles = []

  var i;
  for (i=0; i<diff_array.length; i++) { 
    var patches = await diff_array[i].patches()
    
    var j;
    for (j=0; j<patches.length; j++) {
      var hunks = await patches[j].hunks()
      var diffFile = ''

      var k;
      for (k=0; k<hunks.length; k++) {
        var lines = await hunks[k].lines()

        var l;
        for (l=0; l<lines.length; l++) {
          diffFile += String.fromCharCode(lines[l].origin()) +
            lines[l].content().trim() + '\n'
        }
      }

      diffFiles.push(diffFile)
    }

    
  }

  return diffFiles;
    
}



async function get_theory_commit_sha(commit_sha) {
  //here we'll insert a pattern instead (aka:THEORY#some_sha#), as soon as we have a tryout repo
  const search_by_message = `git log --all --grep=${commit_sha}`
  const access_repo = `cd ${local}`

  const theory_command = await exec(access_repo + " && " + search_by_message)
  const theory_sha = theory_command.stdout

  console.log(theory_sha)
}


async function git_show(commit_sha) {
  
  const search_by_message = `git show -U1000 ${commit_sha}`
  const access_repo = `cd ${local}`

  const show_command = await exec(access_repo + " && " + search_by_message)
  const all_changes = show_command.stdout

  let file_array = all_changes.split(/diff --git[\S\s]*?\+\+\+ .?\//) //split by the whole hunk header
  file_array = file_array.slice(1, file_array.length)

  file_array.forEach(function(file) {
    file = file.replace(/@@ .* @@\n/, "") //get rid of lines added, lines removed headers in code
    file = file.replace(/\\ No newline at end of file/, "") //get rid of this weird info at the end of files
    let tokens = file.split('\n')
    let file_name = tokens[0];
    console.log(`============================= NEW FILE: ${file_name} =============================`)
    let contents = tokens.slice(1, tokens.length).join('\n')
    console.log(contents)
  })

}


/*
async function get_all_commits_sha() {
    const repo = await nodegit.Repository.open(local)
  
    const latest_master_commit = await repo.getMasterCommit()
  
    const commits = await new Promise(function (resolve, reject) {
      var hist = latest_master_commit.history()
      hist.start()
      hist.on("end", resolve);
      hist.on("error", reject);
    });
  
    commits.reverse()
  
    for (var i = 0; i < commits.length; i++) {
      //var sha = commits[i].sha().substr(0,7),   for the sha shorthand, but getting a file by sha shorthand doesn't work at the moment
      
      var sha = commits[i].sha(),
        msg = commits[i].message().split('\n')[0]; //will need this later so I'm leaving it in
        
      console.log(sha + " " + msg);
      var diff = await commits[i].getDiff()
      
     
    }
  
  }
*/

 
  




//get_first_commit().then(console.log("DOONE"))
//get_next_commit("35949ff7dd29c197171339ae6a51389b30787c8f").then((value) => console.log(value))
//get_diff('13a435e480e9ced68a06414d65589d7b2fe90964').then(console.log("DOONE"))
//get_diff('12c4e858812fa47eed16fcd689708a1f9bc75555').then(console.log("DOONE"))
//get_all_commits_sha().then(console.log('Done'))
//get_theory_commit_sha("Introducing").then(console.log("GOT SHA"))
git_show('12c4e858812fa47eed16fcd689708a1f9bc75555').then(console.log("DOONE"))