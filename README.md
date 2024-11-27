# coso-github-actions-versions-calculate

Calculate version number (semantic and build format)

## Inputs

## `GITHUB_TOKEN`
**Required** GitHub token

## `major-number`
**Required** The major number of the version (`"x"` in `"x.y.z"`)

## `minor-number`
**Required** The minor number of the version (`"y"` in `"x.y.z"`)

## `prerelease-custom-identifier`
**optional** Custom pre-relase identifier (`"rc"` in `"x.y.z-rc.t"`)

## `force-finale-version`
**optional** Set `"true"` to force the action to calculate a finale version number (`"x.y.z"`, without pre-relase identifier and number) even if the current branch is not main or master

## Outputs

## `semVersion`
Calculated semantic version number

## `buildVersion`
Calculated build version number

## Example usage

```yaml

steps:  
  - name: Calculate Versions
    id: calculate-version
    uses: cosontech/coso-github-actions-versions-calculate@v1
    with:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      major-number: '1'
      minor-number: '0'
```

Then access returned version numbers through `${{ steps.calculate-version.outputs.semVersion }}` and `${{ steps.calculate-version.outputs.buildVersion }}` :  

```yaml
- name: Display calculated versions
  run: echo "Semantic is ${{ steps.calculate-version.outputs.semVersion }} and Build is ${{ steps.calculate-version.outputs.buildVersion }}"
```

**Note that the "major tag" `v1` will always target the last commit. So, you are sure to use the last version of the action if you use it instead of a specifi version like `v1.0.0`**  

**To manage releases creation, use the *[coso-github-actions-releases-create](https://github.com/cosontech/coso-github-actions-versions-release)* action.**

## Details

The action will determine the version numbers following different criterias.  

### Pre-Release Detection

If the workflow is executed on the `development` or on the `dev` branch, the semantic version number will have the pre-relase identifier `alpha` (eg 1.0.0-alpha.1).  

If the workflow is executed on the `staging` or on the `uat` branch, the semantic version number will have the pre-relase identifier `beta` (eg 1.0.0-beta.1).  

If the workflow is executed on the `main` or on the `master` branch, the semantic version number will not have a pre-relase identifier (eg 1.0.0).  

***Note that you can define a custom pre-release identifier through the prerelease-custom-identifier* parameter. If you define it, the version will be calculated as a pre-release even if the workflow is executed on the `main` or on the `master` branch.**  

### Version Number Calculation

The action will load last releases of the repository to get the calculated version number of the last `finale release` (release with a version that doesn't contain a pre-release identifier).  

If a `finale release` has been found, the action will increment its patch number for the current release.  

If the `finale release` has a version number `1.1.5`, the patch number will be calculated as `1.1.6` by the action.  

### Pre-Release Number Calculation

The action will load last releases of the current branch to get the calculated version number of the last `pre-release` (release with a version that contains a pre-release identifier).  

If a `pre-release` has been found, the action will increment its pre-release number for the current release.  

If the `pre-release` has a version number `1.1.6-alpha.5`, the pre-release number will be calculated as `1.1.6-alpha.6` by the action.