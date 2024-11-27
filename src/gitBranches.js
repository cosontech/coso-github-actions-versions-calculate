const github = require('@actions/github');

function isMainBranch(branchName) {
    const name = getBranchName(branchName);
    return name === 'main' || name === 'master';
}

function getBranchName(value) {
    if (value?.startsWith('refs/heads/')) {
        return value.substring(11);
    }
    else {
        return value ?? 'local';
    }
}

function getCurrentBranchName() {
    return getBranchName(github.context.payload.ref);
}

export default { getBranchName, getCurrentBranchName, isMainBranch }