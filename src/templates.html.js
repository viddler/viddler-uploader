this["JST"] = this["JST"] || {};

this["JST"]["src/templates.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<script type=\"text/template\" id=\"tmpl-video-upload-template\">\n  <div class=\"video-upload-row upload-video-template\" style=\"display: none;\">\n    <div class=\"info\">\n      <p class=\"encode-title\"><span>Uploading:</span></p>\n      <span class=\"status\">Queued for upload</span>\n    </div>\n\n    <div class=\"actions\">\n      <a href=\"#\" class=\"cancel-upload\" style=\"display:none;\">Cancel</a>\n    </div>\n\n    <div class=\"progress\">\n      <div class=\"progress-bar\">\n        <div class=\"progress-bar-inner\" style=\"width: 0px\"></div>\n      </div>\n    </div>\n  </div>\n</script>\n";
  });