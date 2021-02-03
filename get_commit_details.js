var nodegit = require("nodegit"),
  path = require("path"),
  Promise = require('promise');



var url = "https://github.com/web-engineering-tuwien/recipe-search-live-demo.git", //in case we want to clone a repo
  local = "/Users/lorianaporumb/Desktop/RecipePuppy" 
  cloneOpts = {};





const { promisify } = require('util');
const exec = promisify(require('child_process').exec)

//will need
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

//will need
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




//very likely i won't need this either
async function get_theory_commit_sha(commit_sha) {
  //here we'll insert a pattern instead (aka:THEORY#some_sha#), as soon as we have a tryout repo
  const search_by_message = `git log --all --grep=${commit_sha}`
  const access_repo = `cd ${local}`

  const theory_command = await exec(access_repo + " && " + search_by_message)
  const theory_sha = theory_command.stdout

  console.log(theory_sha)
}

//very likely I won't need git_show
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




//****************  CURRENT VERSION for getting file contents  ****************

class ChangedFile {
  constructor(current_path, previous, current) {
    this.current_path = current_path;
    this.previous = previous;
    this.current = current;
  }
}


async function test_function(commit_sha) {
  
  //const search_by_message = `git show -U1000 ${commit_sha}`
  const access_repo = `cd ${local}`
  const get_parent = `git rev-parse ${commit_sha}^`
  

  const parent_command = await exec(access_repo + " && " + get_parent)
  const parent_sha = parent_command.stdout.replace(/(\r\n|\n|\r)/gm, "")

  const get_modified_files_paths = `git diff --name-only ${parent_sha} ${commit_sha}`
  const modified_paths_command = await exec(access_repo + " && " + get_modified_files_paths)
  let modified_file_paths = modified_paths_command.stdout.split("\n")
  modified_file_paths = modified_file_paths.slice(0, modified_file_paths.length-1)


  console.log(modified_file_paths)
  let modified_files = []
  for (let i = 0; i < modified_file_paths.length; i ++) {

    let path = modified_file_paths[i]
    console.log(`Path: ${path}`)
    let file = new ChangedFile(path, '', '')
    let sha = parent_sha
    try {
      let cat_file_at_commit = `git cat-file -p ${sha}:${path}`
      let cat_file_command = await exec(access_repo + " && " + cat_file_at_commit)
      const file_content = cat_file_command.stdout
      file.previous = file_content
    } catch (error) {
      //console.log(error)
    }

    sha = commit_sha
    try {
      let cat_file_at_commit = `git cat-file -p ${sha}:${path}`
      let cat_file_command = await exec(access_repo + " && " + cat_file_at_commit)
      const file_content = cat_file_command.stdout
      file.current = file_content
    } catch (error) {
      //console.log(error)
    }
    modified_files.push(file)
  }

  
  for (let i = 0; i < modified_files.length; i ++) {
    let file = modified_files[i]
    console.log(`************************************ ${file.current_path} ********************************`)
    console.log("###########PREVIOUS###########")
    console.log(file.previous)
    console.log("###########CURRENT###########")
    console.log(file.current)
    
  }
  

}


 
  




//get_first_commit().then(console.log("DOONE"))
//get_next_commit("35949ff7dd29c197171339ae6a51389b30787c8f").then((value) => console.log(value))
//get_diff('13a435e480e9ced68a06414d65589d7b2fe90964').then(console.log("DOONE"))
//get_diff('12c4e858812fa47eed16fcd689708a1f9bc75555').then(console.log("DOONE"))
//get_all_commits_sha().then(console.log('Done'))
//get_theory_commit_sha("Introducing").then(console.log("GOT SHA"))
//git_show('12c4e858812fa47eed16fcd689708a1f9bc75555').then(console.log("DOONE"))

test_function('12c4e858812fa47eed16fcd689708a1f9bc75555').then(console.log("DOONE"))

//get_commit_diffs('12c4e858812fa47eed16fcd689708a1f9bc75555', '95e54cb16faf90d3d7b1652dd44db78f30000d23') 


//git cat-file -p 95e54cb16faf90d3d7b1652dd44db78f30000d23:index.html
