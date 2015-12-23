<a name="0.0.17"></a>
## [0.0.17](https://github.com/ef-ctx/ngAutobahn/compare/v0.0.16...v0.0.17) (2015-12-23)


### Bug Fixes

* **ping:** Cancels the previous interval when starting a new one. ([adb8bfa](https://github.com/ef-ctx/ngAutobahn/commit/adb8bfa))



<a name="0.0.16"></a>
## [0.0.16](https://github.com/ef-ctx/ngAutobahn/compare/v0.0.15...v0.0.16) (2015-12-23)


### Bug Fixes

* **session:** resubscribing brokers fixed. ([76284e9](https://github.com/ef-ctx/ngAutobahn/commit/76284e9))



<a name="0.0.15"></a>
## [0.0.15](https://github.com/ef-ctx/ngAutobahn/compare/v0.0.14...v0.0.15) (2015-12-23)




<a name="0.0.10"></a>
## [0.0.10](https://github.com/ef-ctx/ngAutobahn/compare/v0.0.9...v0.0.10) (2015-12-23)


### Bug Fixes

* **session:** log removed. ([ff0c9a8](https://github.com/ef-ctx/ngAutobahn/commit/ff0c9a8))



<a name="0.0.9"></a>
## [0.0.9](https://github.com/ef-ctx/ngAutobahn/compare/v0.0.8...v0.0.9) (2015-12-23)


### Bug Fixes

* **session:** broker subscription fixed. ([8b77c72](https://github.com/ef-ctx/ngAutobahn/commit/8b77c72))
* **session:** Reject the promise when invoking remoteCall and the session exists but it is not ([e5f05c9](https://github.com/ef-ctx/ngAutobahn/commit/e5f05c9))

### Features

* **diagrams:** Gliffy diagrams added for session. WIP ([3fb4308](https://github.com/ef-ctx/ngAutobahn/commit/3fb4308))



<a name="v0.0.8"></a>
### v0.0.8 (2015-12-15)


#### Features

* **ping:** removed timer ([a2179c70](git@github.com:ef-ctx/ngAutobahn/commit/a2179c70b5b874480e26d649d44f709800c96970))
* **session:**
  * handling lost and close separately. ([bd45f029](git@github.com:ef-ctx/ngAutobahn/commit/bd45f0295ad7d69ad1fcd94f57aa2eee57e549c6))
  * unsubscribe returns a promise ([c8e702b6](git@github.com:ef-ctx/ngAutobahn/commit/c8e702b6ba2cbf1acadbf1f2ad54bc6320f8e94e))

<a name="v0.0.7"></a>
### v0.0.7 (2015-12-08)


#### Features

* **bower:** returned to 1.3.3 ([e281d1a9](git@github.com:ef-ctx/ngAutobahn/commit/e281d1a9b9981f32e8dc3d850859102c61a7c072))
* **pingProvider:** log removed ([1c2f6eef](git@github.com:ef-ctx/ngAutobahn/commit/1c2f6eefb82ec56a48d35810e891bacb6d3fb1df))
* **travis:**
  * fix script ([4a20a1ca](git@github.com:ef-ctx/ngAutobahn/commit/4a20a1cadedf36d4fc25951d9f041b90467e4620))
  * update scripts ([18c901e1](git@github.com:ef-ctx/ngAutobahn/commit/18c901e1132a7f7b6f7072d0f6eef472acf284ae))
  * avoid system check ([f4a18ee4](git@github.com:ef-ctx/ngAutobahn/commit/f4a18ee4bda11073235c35829cc0edfe0927fc75))
  * avoid bower update ([f40439cd](git@github.com:ef-ctx/ngAutobahn/commit/f40439cdb650949c82c9f75b09732d8b4545a66e))
  * added bower cache clear ([1f3daf5c](git@github.com:ef-ctx/ngAutobahn/commit/1f3daf5cc1e08f4f520931b020cd73b82488d3fb))
* **travis.sh:** clean npm ([219c5276](git@github.com:ef-ctx/ngAutobahn/commit/219c527659eef246f853c7cad660bf6cf2d894f5))

<a name="v0.0.6"></a>
### v0.0.6 (2015-12-08)


#### Bug Fixes

* **session:**
  * End session test. ([f2939145](git@github.com:ef-ctx/ngAutobahn/commit/f29391456537ba5638c965f7838ec2633334aa10))
  * typo ([c681c364](git@github.com:ef-ctx/ngAutobahn/commit/c681c3647a3f7a3deae1b04f9d3e59fa08381266))

<a name="v0.0.5"></a>
### v0.0.5 (2015-12-01)


#### Features

* **session:** avoid $q.resolve when performing a remote call. ([cb70b8b6](git@github.com:ef-ctx/ngAutobahn/commit/cb70b8b656021bad8862fc8ceeb8b10296647b98))

<a name="v0.0.4"></a>
### v0.0.4 (2015-11-27)

<a name="v0.0.3"></a>
### v0.0.3 (2015-11-27)


#### Bug Fixes

* **session:** ensure payload is non undefined ([23628a5f](git@github.com:ef-ctx/ngAutobahn/commit/23628a5f31e938bab7826f45ad4175674c5ca436))


#### Features

* **Ping:** ConnectionPing && Ping -> ngAutobahn. ([2a65a3a5](git@github.com:ef-ctx/ngAutobahn/commit/2a65a3a5da729b3ae3fa2a5967135b6ca816671f))
* **session:** $scope.$apply made optional. ([7aba1959](git@github.com:ef-ctx/ngAutobahn/commit/7aba195962e1ae3d772969817393b021abc46634))

