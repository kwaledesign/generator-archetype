'use strict';
var util = require('util');
var path = require('path');
var globule = require('globule');
var shelljs = require('shelljs');
var spawn = require('child_process').spawn;
var yeoman = require('yeoman-generator');
var chalk = require('chalk');

var ArchetypeGenerator = module.exports = function Generator(args, options) {
  yeoman.generators.Base.apply(this, arguments);

  // Exit if Ruby dependencies aren't installed
  var dependenciesInstalled = ['bundle', 'ruby'].every(function (depend) {
    return shelljs.which(depend);
  });

  if (!dependenciesInstalled) {
    console.log('Looks like you\'re missing some dependencies.' + '\nMake sure you have installed:' + chalk.white('\nRuby') + chalk.white('\nBundler gem') + chalk.white('\nArchetype-Utilities') + chalk.white('\nColorkit') + chalk.white('\nModular-Scale') + chalk.white('\nBreakpoint') + '\n...then run again.');
    shelljs.exit(1);
  }

  // Get static info for templating
  this.appname = path.basename(process.cwd());
  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
  this.gitInfo = {
    name: shelljs.exec('git config user.name', {silent: true}).output.replace(/\n/g, ''),
    email: shelljs.exec('git config user.email', {silent: true}).output.replace(/\n/g, ''),
    github: shelljs.exec('git config github.user', {silent: true}).output.replace(/\n/g, ''),
  };

  this.on('end', function () {
    // Install Grunt and Bower dependencies
    this.installDependencies({ skipInstall: options['skip-install'] });
  }); 
  
};

util.inherits(ArchetypeGenerator, yeoman.generators.Base);

/*
var ArchetypeGenerator = module.exports = function ArchetypeGenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  this.on('end', function () {
    this.installDependencies({ skipInstall: options['skip-install'] });
  });

  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};

util.inherits(ArchetypeGenerator, yeoman.generators.Base);
*/


// User input
ArchetypeGenerator.prototype.askForAuthor = function askForAuthor() {
  var cb = this.async();

  // welcome message
  console.log(this.yeoman);
  console.log(chalk.yellow('This generator will scaffold and wire an Archetype site. Yo, Archetype!') +
    chalk.yellow('\n\nTell us a little about yourself.') + ' ☛');

  var prompts = [{
    name: 'author',
    message: 'Name',
//    default: this.gitInfo.name
  },
  {
    name: 'email',
    message: 'Email',
//    default: this.gitInfo.email
  },
  {
    name: 'github',
    message: 'GitHub Username',
//    default: this.gitInfo.github
  },
  {
    name: 'twitter',
    message: 'Twitter Username',
//    default: '@' + this.gitInfo.github
  }];

  this.prompt(prompts, function (props) {

    this.author  = props.author;
    this.email   = props.email;
    this.github  = props.github;
    this.twitter = props.twitter[0] === '@' ? props.twitter.substr(1) : props.twitter;

    cb();
  }.bind(this));
};

ArchetypeGenerator.prototype.askForStructure = function askForStructure() {
  var cb = this.async();

  console.log(chalk.yellow('\nSet up some directories.') + ' ☛' +
    '\nNested directories are fine.');

  var slashFilter = function (input) {
    return input.replace(/^\/*|\/*$/g, '');
  };

  var prompts = [{
    name: 'cssDir',
    message: 'Choose a css directory',
    default: 'css',
    filter: slashFilter
  },
  {
    name: 'jsDir',
    message: 'Choose a javascript directory',
    default: 'js',
    filter: slashFilter
  },
  {
    name: 'imgDir',
    message: 'Choose an image file directory',
    default: 'image',
    filter: slashFilter
  },
  {
    name: 'fontsDir',
    message: 'Choose a webfonts directory',
    default: 'fonts',
    filter: slashFilter
  },
  {
    name: 'cssPreDir',
    message: 'Choose a css preprocessor directory',
    default: 'sass',
    filter: slashFilter
  }];

  this.prompt(prompts, function (props) {

    this.cssDir    = props.cssDir;
    this.jsDir     = props.jsDir;
    this.imgDir    = props.imgDir;
    this.fontsDir  = props.fontsDir;
    this.cssPreDir = props.cssPreDir;

    cb();
  }.bind(this));
};

ArchetypeGenerator.prototype.askForTemplates = function askForTemplates() {
  var cb = this.async();

  console.log(chalk.yellow('\nInclude  HTML5★ Boilerplate?') + ' ☛');

  var prompts = [{
    name: 'templateType',
    type: 'list',
    message: 'Do you want to use a template?',
    choices: ['HTML5 ★ Boilerplate', 'none']
  }];


  this.prompt(prompts, function (props) {

    if (props.templateType === 'HTML5 ★ Boilerplate') {
      this.templateType = 'h5bp';
    }
    else if (!props.templateType === 'HTML5 ★ Boilerplate') {
      this.templateType = 'none';
    }

    cb();
  }.bind(this));
};

ArchetypeGenerator.prototype.askForh5bp = function askForh5bp() {
  if (this.templateType === 'h5bp') {
    var cb = this.async();

    var prompts = [{
      name: 'h5bpJs',
      type: 'confirm',
      message: 'Add H5★BP javascript files?',
    },
    {
      name: 'h5bpIco',
      type: 'confirm',
      message: 'Add H5★BP favorite and touch icons?'
    },
    {
      name: 'h5bpDocs',
      type: 'confirm',
      message: 'Add H5★BP documentation?'
    },
    {
      name: 'h5bpAnalytics',
      type: 'confirm',
      message: 'Include Google Analytics?'
    }];

    this.prompt(prompts, function (props) {

      this.h5bpJs        = props.h5bpJs;
      this.h5bpIco       = props.h5bpIco;
      this.h5bpDocs      = props.h5bpDocs;
      this.h5bpAnalytics = props.h5bpAnalytics;

      cb();
    }.bind(this));
  }
  else {
    this.h5bpJs        = false;
    this.h5bpIco       = false;
    this.h5bpDocs      = false;
    this.h5bpAnalytics = false;
  }
};

// Generate App
/*ArchetypeGenerator.prototype.rubyDependencies = function rubyDependencies() {
  this.template('Gemfile');
  this.conflicter.resolve(function (err) {
    if (err) {
      return this.emit('error', err);
    }
    shelljs.exec('bundle install');
  });
};*/

ArchetypeGenerator.prototype.git = function git() {
  this.template('gitignore', '.gitignore');
  this.copy('gitattributes', '.gitattributes');
};

ArchetypeGenerator.prototype.gruntfile = function gruntfile() {
  this.template('Gruntfile.js');
};

ArchetypeGenerator.prototype.packageJSON = function packageJSON() {
  this.template('_package.json', 'package.json');
};

ArchetypeGenerator.prototype.bower = function bower() {
  this.copy('bowerrc', '.bowerrc');
  this.template('_bower.json', 'bower.json');
};

ArchetypeGenerator.prototype.jshint = function jshint() {
  this.copy('jshintrc', '.jshintrc');
};

ArchetypeGenerator.prototype.csslint = function csslint() {
  this.template('csslintrc', '.csslintrc');
};

ArchetypeGenerator.prototype.editor = function editor() {
  this.copy('editorconfig', '.editorconfig');
};

ArchetypeGenerator.prototype.app = function app() {
  
  // Scaffold Directories
  this.mkdir('app');
  this.mkdir('app/templates');
  this.mkdir(path.join('app', this.cssDir));
  this.mkdir(path.join('app', this.jsDir));
  this.mkdir(path.join('app', this.imgDir));
  this.mkdir(path.join('app', this.fontsDir));
  this.mkdir(path.join('app', this.cssPreDir));

};

ArchetypeGenerator.prototype.templates = function templates() {

  // HTML5 Boilerplate template
  if (this.templateType === 'h5bp') {
    var cb = this.async();

      // H5BP index.html
      this.template('conditional/template-h5bp/index.html', 'app/index.html');

    // Get h5bp from git repository
    this.remote('h5bp', 'html5-boilerplate', 'v4.2.0', function (err, remote) {
      if (err) {
        return cb(err);
      }

      remote.copy('.htaccess', 'app/.htaccess');
      remote.copy('404.html', 'app/404.html');
      remote.copy('crossdomain.xml', 'app/crossdomain.xml');
      remote.copy('LICENSE.md', 'app/_h5bp-docs/LICENSE.md');
      remote.copy('robots.txt', 'app/robots.txt');

      // Js boilerplate
      // Ignore vendor diectory because we're handling components with Bower
      if (this.h5bpJs) {
        remote.copy('js/main.js', path.join('app', this.jsDir, 'main.js'));
        remote.copy('js/plugins.js', path.join('app', this.jsDir, 'plugins.js'));
      }
      else {
        this.write(path.join('app', this.jsDir, 'main.js'), '');
      }

      // Touch and favicons
      if (this.h5bpIco) {
        remote.copy('apple-touch-icon-114x114-precomposed.png', 'app/apple-touch-icon-114x114-precomposed.png');
        remote.copy('apple-touch-icon-144x144-precomposed.png', 'app/apple-touch-icon-144x144-precomposed.png');
        remote.copy('apple-touch-icon-57x57-precomposed.png', 'app/apple-touch-icon-57x57-precomposed.png');
        remote.copy('apple-touch-icon-72x72-precomposed.png', 'app/apple-touch-icon-72x72-precomposed.png');
        remote.copy('apple-touch-icon-precomposed.png', 'app/apple-touch-icon-precomposed.png');
        remote.copy('apple-touch-icon.png', 'app/apple-touch-icon.png');
        remote.copy('favicon.ico', 'app/favicon.ico');
      }

      // Docs
      if (this.h5bpDocs) {
        remote.directory('doc', 'app/_h5bp-docs/code-docs');
        remote.copy('CHANGELOG.md', 'app/_h5bp-docs/CHANGELOG.md');
        remote.copy('CONTRIBUTING.md', 'app/_h5bp-docs/CONTRIBUTING.md');
        remote.copy('README.md', 'app/_h5bp-docs/README.md');
      }

      cb();
    }.bind(this));

    // Google analytincs include
/*    if (this.h5bpAnalytics) {
      this.copy('conditional/template-h5bp/_includes/googleanalytics.html', 'app/_includes/googleanalytics.html');
    }*/
  }
};

ArchetypeGenerator.prototype.archetype = function app() { 
  var cb = this.async();

  // Get Archetype and provide a "remote" object as a facade API
  this.remote('kwaledesign', 'Archetype', function(err, remote) {
    if (err) {
      return cb(err);
    }
    
    // copy config.rb file
    remote.template('config.rb', 'app/config.rb');
    // Archetype screen.scss
    remote.template('sass/screen.scss', path.join('app', this.cssPreDir, 'screen.scss')); 

    // Archetype Base
    remote.directory('sass/base/', path.join('app', this.cssPreDir, 'base')); 
    // Archetype Objects  
    remote.directory('sass/objects/', path.join('app', this.cssPreDir, 'objects')); 
    // Archetype Components
    remote.directory('sass/components/', path.join('app', this.cssPreDir, 'components')); 
    // Archetype Layout
    remote.directory('sass/layout/', path.join('app', this.cssPreDir, 'layout')); 
    // Archetype Temp
    remote.directory('sass/temp/', path.join('app', this.cssPreDir, 'temp')); 

    // Archetype Docs (Styleguide and Pattern Library powered by Dexy)
    remote.directory('docs', 'app/docs');

    cb(); 
  }.bind(this));
};


