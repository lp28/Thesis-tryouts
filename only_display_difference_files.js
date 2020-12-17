var nodegit = require("nodegit"),
  path = require("path"),
  Promise = require('promise');



var url = "https://github.com/web-engineering-tuwien/recipe-search-live-demo.git", //in case we want to clone a repo
  local = "/Users/lorianaporumb/Desktop/RecipePuppy" 
  cloneOpts = {};


/**
 * Opens locally stored repo at the path stored in the 'local' variable.
 * Gets latest commit on master and gets the sha of the latest 10 commits (will be changed to all commits in the future)
 * For each commit, it calls a function to walk through and display the working tree
 */

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
    /*
    var sha = commits[i].sha(),
      msg = commits[i].message().split('\n')[0]; //will need this later so I'm leaving it in
      */
    //console.log(sha + " " + msg);
    

    if(i == 0) {
        //get (and display) all file contents since this is the first commit
        await display_tree(commits[i])
    } else {
        //only get file contents for files that changed since the prev commit
        await display_tree_diff(commits[i], commits[i - 1])
    }
   
  }

}


/**
 * Displays entry details, as well as the first 10 lines (can be adjusted to display more)
 * @param {*} entry a file or directory in a commit's working tree (so far it only works with files)
 */
async function get_file_content_for_commit(entry /*, commit_sha*/) {

  const entry_blob = await entry.getBlob()

  console.log(entry.name(), entry.sha(), entry_blob.rawsize() + "b");
  console.log("========================================================\n\n");
  var lines = entry_blob.toString();
  console.log(lines)
}


/**
 * Gets the tree of the commit given as an argument
 * Starts a tree walker
 * When an entry is found, it calls get_content_for_commit() that gets its content
 * @param {*} tree a commit's working tree
 */
async function display_tree(commit) {

  var tree = await commit.getTree()
  var walker = tree.walk();
  walker.on("entry", async function (entry) {
    await get_file_content_for_commit(entry)
  });

  walker.start();
}

/**
 * Gets the trees of both commits given as arguments.
 * Returns a list of paths to the files that have been modified in current_commit
 * @param {*} current_commit 
 * @param {*} prev_commit 
 */
async function get_commit_diffs(current_commit, prev_commit) {
    var tree = await current_commit.getTree()
    var prev_tree = await prev_commit.getTree()
    const diff = await prev_tree.diff(tree);
    const patches = await diff.patches();
    var paths_to_diff_files = []

    for (const patch of patches) {
        paths_to_diff_files.push(patch.newFile().path());
    }

    return paths_to_diff_files
}



/**
 * Like display_tree, with the difference that it only displays the content of files that 
 * have been changed in the current_commit
 * @param {*} current_commit 
 * @param {*} prev_commit 
 */
async function display_tree_diff(current_commit, prev_commit) {
   
  var paths_to_diff_files = await get_commit_diffs(current_commit, prev_commit)

  var tree = await current_commit.getTree()
  var walker = tree.walk();
  walker.on("entry", async function (entry) { //only get (display) the file contents for files that have been changed since the last commit
    if(paths_to_diff_files.includes(entry.path())) {
        await get_file_content_for_commit(entry)
    }
  });

  walker.start();
}



get_all_commits_sha().then(console.log("DONE"))




