## Release Checklist

Here are the steps to follow when making a release.

* Update `HISTORY.md`
* Add new contributors to `package.json`, if any
* Commit those changes as "Release 0.1.2"
  * `$ git add package.json`
  * `$ git commit -m "Release 0.1.2"`
* Tag commit as "v0.1.2" with short description of main changes
  * `$ git tag -a v0.1.2 -m "Description of changes"`
* Push to main repo on GitHub
  * `$ git push origin master`
  * `$ git push origin v0.1.2`
* Wait for build to go green
* Publish to npmjs.org
  * `$ gulp release`
