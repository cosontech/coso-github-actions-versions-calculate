import { ParsedVersionNumber } from './models';
const gitBranches = require('./gitBranches');

function compareFinaleReleases(versionNumber1, versionNumber2) {
	return compareVersions(versionNumber1, versionNumber2, true);
}

function comparePreReleases(versionNumber1, versionNumber2) {
	return compareVersions(versionNumber1, versionNumber2, false);
}

function compareVersions(versionNumber1, versionNumber2, areFinaleReleases) {

    //compare major numbers
    if (versionNumber1.majorNumber > versionNumber2.majorNumber) return -1;
    else if (versionNumber1.majorNumber < versionNumber2.majorNumber) return 1;

    //major numbers are same between 1 & 2, compare minor numbers
    else if (versionNumber1.minorNumber > versionNumber2.minorNumber) return -1;
    else if (versionNumber1.minorNumber < versionNumber2.minorNumber) return 1;

    //major & minor numbers are same between 1 & 2, compare patch numbers
    else if (versionNumber1.patchNumber > versionNumber2.patchNumber) return -1;
    else if (versionNumber1.patchNumber < versionNumber2.patchNumber) return 1;

    //major, minor & patch numbers are same between 1 & 2
    if (areFinaleReleases) return 0;

    //compare pre-release numbers
    if (versionNumber1.preReleaseNumber > versionNumber2.preReleaseNumber) return -1;
    else if (versionNumber1.preReleaseNumber < versionNumber2.preReleaseNumber) return 1;
    else return 0;
}

function getPreReleaseIdentifier(branchName, forcedPreReleaseIdentifier) {
    if (!forcedPreReleaseIdentifier) {
        if (branchName === 'dev' || branchName === 'development') return 'alpha'
        else if (branchName === 'staging' || branchName === 'uat') return 'beta'
        else if (!gitBranches.isMainBranch(branchName)) return 'tmp'
        else return null;
    }
    else {
        if (forcedPreReleaseIdentifier.startsWith('-')) forcedPreReleaseIdentifier = forcedPreReleaseIdentifier.substring(1);
        return forcedPreReleaseIdentifier;
    }
}

function parseVersion(version) {
    var splitted = new ParsedVersionNumber();
    
    var workVersion = version;
    if (workVersion.startsWith('v')) workVersion = workVersion.substring(1);

    splitted.fullVersionNumber = workVersion;
    
    if (workVersion.indexOf('.') === -1 && parseInt(workVersion) !== Infinity) {
        splitted.majorNumber = parseInt(workVersion);
        splitted.minorNumber = 0;
        splitted.patchNumber = 0;
        return splitted;
    }

    splitted.majorNumber = workVersion.substring(0, workVersion.indexOf('.'));
    workVersion = workVersion.substring(splitted.majorNumber.length + 1);
    splitted.majorNumber = parseInt(splitted.majorNumber);

    splitted.minorNumber = workVersion.substring(0, workVersion.indexOf('.'));
    workVersion = workVersion.substring(splitted.minorNumber.length + 1);
    splitted.minorNumber = parseInt(splitted.minorNumber);

    splitted.patchNumber = workVersion;
    if (splitted.patchNumber.indexOf('-') > -1) {
        splitted.patchNumber = splitted.patchNumber.substring(0, splitted.patchNumber.indexOf('-'));
        
        workVersion = workVersion.substring(splitted.patchNumber.length + 1);
        splitted.preReleaseIdentifier = workVersion.substring(0, workVersion.indexOf('.'));
        
        workVersion = workVersion.substring(splitted.preReleaseIdentifier.length + 1);
        splitted.preReleaseNumber = parseInt(workVersion.substring(0));

        splitted.isPreRelease = true;
    }
    splitted.patchNumber = parseInt(splitted.patchNumber);

    return splitted;
}

exports.compareFinaleReleases = compareFinaleReleases
exports.comparePreReleases = comparePreReleases
exports.compareVersions = compareVersions
exports.getPreReleaseIdentifier = getPreReleaseIdentifier
exports.parseVersion = parseVersion