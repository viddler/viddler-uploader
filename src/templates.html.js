this["JST"] = this["JST"] || {};

this["JST"]["src/templates.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<script type=\"text/template\" id=\"tmpl-video-upload-template\">\n  <div class=\"svi svi-progress upload-video-template\" style=\"display: none;\">\n    <div class=\"svi-icon\">\n    </div>\n\n    <div class=\"ljust\">\n      <h4 class=\"encode-title\"><span>Uploading:</span></h4>\n      <span class=\"status\">Queued for upload</span>\n    </div>\n\n    <div class=\"rjust\">\n      <a href=\"#\" class=\"red retry-encode\" style=\"display:none;\">Retry</a>\n      <a href=\"#\" class=\"red cancel-upload\" style=\"display:none;\">Cancel</a>\n    </div>\n\n    <ul>\n      <li>\n        <div class=\"progress-bar animated\">\n          <div class=\"progress-bar-inner\" style=\"width:0%\"></div>\n        </div>\n      </li>\n    </ul>\n  </div>\n</script>\n";
  });
