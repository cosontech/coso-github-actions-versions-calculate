const core = require('@actions/core');
const github = require('@actions/github');
const {  getCurrentBranchName, isMainBranch } = require('./gitBranches');
const { compareFinaleReleases, comparePreReleases, getPreReleaseIdentifier, parseVersion } = require('./versions');

// ****INPUTS****

const majorNumber = core.getInput('major-number');
const minorNumber = core.getInput('minor-number');
const forceFinaleVersion = core.getInput('force-finale-version');
var preReleaseIdentifier = core.getInput('prerelease-custom-identifier');

// ****MODELS****

var BreakException = {};

// ****EXECUTION****

const currentBranch = getCurrentBranchName();
console.log(`Current branch: ${currentBranch}`);

const runOnMainBranch = isMainBranch(currentBranch);
console.log(`Is main branch: ${runOnMainBranch}`);

const runPreRelease = forceFinaleVersion !== 'true' && (!runOnMainBranch || preReleaseIdentifier);
console.log(`Is Pre-Release: ${runPreRelease}`);
if (runPreRelease) {
    preReleaseIdentifier = getPreReleaseIdentifier(currentBranch, preReleaseIdentifier);
    console.log(`Pre-Release identifier: ${preReleaseIdentifier}`);
}

var calculatedSemVersion = (runPreRelease)
                        ? `${majorNumber}.${minorNumber}.0-${preReleaseIdentifier}.1`
                        : `${majorNumber}.${minorNumber}.0`;
console.log(`Base semantic version: ${calculatedSemVersion}`);
var calculatedBuildVersion = `${majorNumber}.${minorNumber}.0.0`;
console.log(`Base build version: ${calculatedBuildVersion}`);

try {
    const myToken = core.getInput('GITHUB_TOKEN');
    const octokit = github.getOctokit(myToken);

    var currentPage = 1;
    var lastFinaleRelease;
    var lastPreRelease;

    const parsePages = async () => {
        console.log('Loading the list of releases...');
        const parsedReleases = [];
        const loadingProcess = await octokit.paginate(
            `GET /repos/:repoOwner/:repoName/releases`, 
            {
                repoOwner: github.context.repo.owner,
                repoName: github.context.repo.repo,
                per_page: 100
            },
            (releases, done) => {
                console.log(`Page ${currentPage}`);

                if (releases?.data) {
                    if (releases.data.length > 1) console.log(`${releases.data.length} releases found, parsing them`);
                    else if (releases.data.length == 1) console.log(`${releases.data.length} release found, parsing it`);
            
                    try {
                        releases.data.forEach(release => {
                            console.log(`Release ${release.tag_name} (branch ${release.target_commitish})`);
                            const parsedRelease = parseVersion(release.tag_name);
                            parsedReleases.push(parsedRelease);
                        });
                    }
                    catch (e) {
                        if (e !== BreakException) throw e;
                    }
                }
                else {
                    console.log('No release found');
                    done();
                }

                currentPage = currentPage + 1;
            }
        );
        console.log(`${parsedReleases.length} releases found`);

        console.log('');
        console.log('Find the last finale release (with same major and minor)');
        const finaleReleases = parsedReleases.filter(x => !x.isPreRelease);
        if (finaleReleases) {
            lastFinaleRelease = finaleReleases.filter(x => x.majorNumber === parseInt(majorNumber) && x.minorNumber === parseInt(minorNumber)).sort(compareFinaleReleases)[0];
        }
        if (lastFinaleRelease) console.log(`Last Finale Release: ${lastFinaleRelease?.fullVersionNumber}`);
        else console.log('Last Finale Release: Not Found');

        if (runPreRelease) {
            console.log('');
            console.log('Find the last pre-release (with same major and minor)');

            const preReleases = parsedReleases.filter(x => x.isPreRelease && x.preReleaseIdentifier == preReleaseIdentifier);
            if (preReleases) {
                lastPreRelease = preReleases.filter(x => x.majorNumber === parseInt(majorNumber) && x.minorNumber === parseInt(minorNumber)).sort(comparePreReleases)[0];
            }
            if (lastPreRelease) console.log(`Last Pre-Release: ${lastPreRelease?.fullVersionNumber}`);
            else console.log('Last Pre-Release: Not Found');
        }

        var patch = 0;
        if (lastFinaleRelease) patch = lastFinaleRelease.patchNumber + 1;

        if (!runPreRelease && lastFinaleRelease) {
            calculatedSemVersion = `${majorNumber}.${minorNumber}.${patch}`;
            calculatedBuildVersion = `${majorNumber}.${minorNumber}.${patch}.0`;
        }
        else if (runPreRelease && lastPreRelease) {
            const preReleaseNumber = lastPreRelease.patchNumber === patch ? lastPreRelease.preReleaseNumber + 1 : 1;
            calculatedSemVersion = `${majorNumber}.${minorNumber}.${patch}-${preReleaseIdentifier}.${preReleaseNumber}`;
            calculatedBuildVersion = `${majorNumber}.${minorNumber}.${patch}.0`;
        }
        else if (runPreRelease && lastFinaleRelease) {
            calculatedSemVersion = `${majorNumber}.${minorNumber}.${patch}-${preReleaseIdentifier}.1`;
            calculatedBuildVersion = `${majorNumber}.${minorNumber}.${patch}.0`;
        }

        core.setOutput("semVersion", calculatedSemVersion);
        core.setOutput("buildVersion", calculatedBuildVersion);
        console.log(`Calculated semantic version: ${calculatedSemVersion}`);
        console.log(`Calculated build version: ${calculatedBuildVersion}`);
    };

    parsePages();
} catch (error) {
    core.setFailed(error);
}
