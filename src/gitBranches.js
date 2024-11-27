const github = require('@actions/github');

export function isMainBranch(branchName) {
    const name = getBranchName(branchName);
    return name === 'main' || name === 'master';
}

export function getBranchName(value) {
    if (value?.startsWith('refs/heads/')) {
        return value.substring(11);
    }
    else {
        return value ?? 'local';
    }
}

export function getCurrentBranchName() {
    return getBranchName(github.context.payload.ref);
}
