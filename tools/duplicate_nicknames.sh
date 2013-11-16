#!/bin/bash

node nicknames.js | uniq -D -w 3
