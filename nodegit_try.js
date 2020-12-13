var nodegit = require("nodegit"),
  path = require("path"),
  Promise = require('promise');



var url = "https://github.com/web-engineering-tuwien/recipe-search-live-demo.git", //in case we want to clone a repo
  local = "/Users/lorianaporumb/Desktop/RecipePuppy" 
  cloneOpts = {};


/**
 * Opens locally stored repo at the path stored in the 'local' variable.
 * Gets latest commit on master and gets the sha of the latest 10 commits (will be changed to all commits in the future)
 * For each commit, it calls a function to walk through the working tree
 */

async function get_all_commits_sha() {
  const repo = await nodegit.Repository.open(local)
  const current_branch = await repo.getCurrentBranch()

  console.log("On " + current_branch.shorthand() + " (" + current_branch.target() + ")")

  const latest_commit = await repo.getBranchCommit(current_branch.shorthand())

  const commits = await new Promise(function (resolve, reject) {
    var hist = latest_commit.history()
    hist.start()
    hist.on("end", resolve);
    hist.on("error", reject);
  });


  var commits_sha = []

  for (var i = 0; i < commits.length; i++) {
    //var sha = commits[i].sha().substr(0,7),   for the sha shorthand, but getting a file by sha shorthand doesn't work at the moment
    var sha = commits[i].sha(),
      msg = commits[i].message().split('\n')[0]; //will need this later so I'm leaving it in
    commits_sha.push(sha)
    //console.log(sha + " " + msg);
    var tree = await commits[i].getTree()
    
    await walk_through_tree(tree)
  }


  //console.log("before call")
  //var file_content = await get_file_content_for_commit("index.html", commits_sha[0]).then(console.log("done"))
  //console.log(commits_sha)

}


/**
 * Displays entry details, as well as the first 10 lines (can be adjusted to display more)
 * @param {*} entry a file or directory in a commit's working tree (so far it only works with files)
 */
async function get_file_content_for_commit(entry /*, commit_sha*/) {
  //const repo = await nodegit.Repository.open('./RecipePuppy')
  //const commit = await repo.getCommit(commit_sha)
  //const entry = await commit.getEntry(file_path)
  const entry_blob = await entry.getBlob()

  console.log(entry.name(), entry.sha(), entry_blob.rawsize() + "b");
  console.log("========================================================\n\n");
  var firstTenLines = entry_blob.toString().split("\n").slice(0, 10).join("\n");
  console.log(firstTenLines);
  console.log("...")
}


/**
 * Starts a tree walker on the tree given as argument
 * When an entry is found, it calls get_content_for_commit() that gets its content
 * @param {*} tree a commit's working tree
 */
async function walk_through_tree(tree) {

  var walker = tree.walk();
  walker.on("entry", async function (entry) {
    await get_file_content_for_commit(entry)
  });

  walker.start();
}


/**This function will call walk_through_tree() that calls get_file_content_for_commit() */
get_all_commits_sha().then(console.log("DOOOONE"))




