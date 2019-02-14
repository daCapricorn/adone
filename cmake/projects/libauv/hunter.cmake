# !!! DO NOT PLACE HEADER GUARDS HERE !!!

include(hunter_add_version)
include(hunter_cacheable)
include(hunter_cmake_args)
include(hunter_download)
include(hunter_pick_scheme)
include(hunter_report_broken_package)

hunter_add_version(
  PACKAGE_NAME libauv
  VERSION 1.23.2
  URL "https://github.com/adone-global/libauv/archive/v1.23.2.tar.gz"
  SHA1 f8a620eb132dfdb5a2e53e9142766380b80c3ea5
)

hunter_pick_scheme(DEFAULT url_sha1_cmake)

hunter_cmake_args(libauv CMAKE_ARGS BUILD_TESTING=OFF)

hunter_cacheable(libauv)
hunter_download(PACKAGE_NAME libauv)