/**
 * --------------------------------------------------------------------
 * jQuery-Plugin "SplitSelect" 
 * Version: 1.0, 25/06/2010
 * by Alex Skrypnyk, alex.designworks@gmail.com
 *
 * Copyright 2010 Alex Skrypnyk
 * Licensed under GPL (http://www.opensource.org/licenses/gpl-license.php)
 *
 * Changelog:
 *    changelog.txt
 * --------------------------------------------------------------------
 * @example $(function(){$('.splitselect').splitselect();});
 * @desc Parses all form element select with class 'splitselect' and creates multiple selects with parsed value for each of parsed selects.
 *
 * --------------------------------------------------------------------
 * Please, leave this header when copying.
 */

/**
 * --------------------------------------------------------------------
 * THE MAIN IDEA:
 * 1. The Source Select is hidden using css. It is not removed from the DOM that it would be able to return a value through a form.
 * 2. Initial select is split into Split Selects using specified delimiter.		
 * 3. Split Selects are shown as dependable (cascade) selects using specified jQuery plugins for visualization.
 * 4. Combined Split Selects text is used to set Source Text value to required one when the last Split Select option in the sequence is selected.
 * --------------------------------------------------------------------
 * FEATURES
 * - More than 1 Source Select is supported.
 * - Quantity of levels may be different within one Source Select.
 * - jQuery effects are used to show selection process.
 * - Selects can be either vertical or horizontal.
 * --------------------------------------------------------------------
 */
 
 /**
  * Default options
  *
  * @param string classname
  *   Classname of all Split Selects that are inserted into DOM.
  *   Default: 'splitselectel'
  *
  * @param string defaultText
  *   The text to display as defualt value in all Split Selects that are inserted into DOM.
  *   Dafault: 'Please select',      
  *
  * @param object hideFX
  *   Effect and settings to hide Split Select.
  *     @param string fx
  *       Effect name.
  *       Default: "fadeIn",
  *     @param object fxSettings 
  *       Effect settings. Different for each specified effect.
  *       @param int duration          
  *         Default: 500
  *           
  * @param bool hidesource
  *   Hide all Source Selects.
  *   Default: true
  *
  * @param object ShowFX
  *   Effect and settings to Show Split Select.
  *     @param string fx
  *       Effect name.
  *       Default: "fadeOut",
  *     @param object fxSettings 
  *       Effect settings. Different for each specified effect.
  *       @param int duration          
  *         Default: 500
  *           
  * @param string orientation
  *   Orientation of appearance of Split Selects.  
  *   Allowed values: 
  *     "horizontal" or "h"
  *     "vertical" or "v"
  *   Default: horizontal
  *
  * @param string splitter 
  *   A substring to split text of options in Source Selects.
  *   Default: ' - '
  */

(function ($) {
  //PUBLIC  
  var opt; //Options
  var originalSelects = new Object(); //Container for all original selects on the page
  var SplitSelects = new Object(); //Container of all Split Selects on the page
  var indexes = new Array(); //An array of hashed indexes
  var delim = '___'; //Hash delimiter
  
  /**
   * Initialize plugin
   *      
   * @param options
   *   An object containing settings for the plugin. Optional.
   *
   * @return
   *   Referenced to current objects
   */
  $.fn.splitselect = function (options) {
    //Default options
    opt = $.extend({     
      classname: 'splitselectel',
      defaultText: 'Please select',      
      hideFX: {
                fx: "fade",
                settingsFX: {
                  duration: 500
                }
              }, 
      hidesource: true,
      showFX: {
                fx: "fade",
                duration: 500,
                settingsFX: {},
                cb: null
              },       
      orientation: "horizontal",              
      splitter: ' - '
    }, options);
    //Traversing through each select
    $(this).each(function () {
      //Cache options and values from all selects on the page
      var id = $(this).attr("id");
      originalSelects[id] = new Object();
      $(this).children('option').each(function (j) {
        originalSelects[id][$(this).attr("value").toString()] = $(this).attr("text"); //Create a record in cahced array
      });
      //Parse selects values into SplitSelects
      for (var sk in originalSelects) {
        for (var ok in originalSelects[sk]) {
          if (ok !="") {
            addSplitSelect(sk, originalSelects[sk][ok].split(opt.splitter));
          }
        }
      }
      //Hide Source Select
      if (opt.hidesource) {
        $(this).hide();
      }
      //Show first (root) level of Split Select
      $(this).showSelect(id, "root");
    });
    return $(this);
  };
  
  /**
   * Show Split Select.
   *      
   * 1) Recursive function to show the Split Select 
   * for specified by ID Source Select 
   * based on the value of the parent Split Select.
   * 
   * 2) Use to change the value of Source Select 
   * when the last Split Select in the sequence is selected.
   *
   * 3) Current Split Select is shown using specified effects.
   *
   * 4) Other visible Split Selects are hidden recurively using specified effects.
   *
   * @param string id
   *   DOM id of the Source Select.
   *   ID used along with Val to encode a unique id.
   *
   * @param string val
   *   Value of parent Split Select. First level starts with "root". 
   *   Val used along with ID to encode a unique id.
   */
  $.fn.showSelect = function (id, val) {
    //Create encoded jQuery ID to access current Split Select object
    var sid = '#' + encodeID(id, val);
    //Chech that Split Select does not exist in DOM yet and add it to DOM.
    if ($(sid).length == 0) {
      //Render a Select
      var rs = renderSelect(id, val);
      if (rs != "") {
        this.appendToDOM(rs, opt.orientation);
        $(sid).bind('change', {dataID: id }, function (event) {
            var val = $(this).find(':selected').text();
            if (!empty(val)) {
              $(this).hideSelect(event.data.dataID, val); //Hide all child Split Selects. Recursive. 
                                                          //This will not hide currently shown child Split Selects as 
                                                          //the whole function will be triggered only when current Split Select changes.
                                                          //Therefore, no filtering on currently shown child Selects is required.
              $(this).showSelect(event.data.dataID, val); //Show child Split Select. Recursive.
          }
        });
      } else {        
        //Get the text of all selected options for all Split Selects of Source Select with id.
        var t = getConcatSelectedText(id);                  
        //Cache options of Source Select. Does not include options with empty values (like "Please select").
        var options = $('#' + id).find('option').not($('[value=""]'));
        //Traverse through options of Source Select.
        for (var i = 0; i < options.length; i++) {
          //Find a match of Source Select options and SplitSelects text.
          if (options[i].text == t) {
            //Set the value of the Source Select to the value of the matched option.
            $('#' + id).attr("value", options[i].value);
          }
        }
      }
    } 
    
    //Show Split Select using specified effect.
    $(sid).hide().showFX();
  }
  
  /**
   * Hide Split Select.
   *      
   * 1) Recursive function to hide the Split Select 
   * for specified by ID Source Select 
   * based on the value of the parent Split Select.
   * 
   * 2) Current Split Select is hidden using specified effects.     
   *
   * @param string id
   *   DOM id of the Source Select.
   *   ID used along with Val to encode a unique id.
   *
   * @param string val
   *   Value of parent Split Select. First level starts with "root". 
   *   Val used along with ID to encode a unique id.
   */
  $.fn.hideSelect = function (id, val) {    
    //Cache options array. Does not include options with empty values (like "Please select").
    var options = $(this).find('option').not($('[value=""]'));
    //Traverse through options and hide all visible Split Selects, that referenced from that options.
    for (var i = 0; i < options.length; i++) {
      $('#' + encodeID(id, options[i].text)).each(function () {
        //Hide itself using effect
        $(this).hideFX();
        //Reset values to default
        $(this).attr('value', '');
        //Hide child select. Recursive.
        $(this).hideSelect(id, options[i].text);
      });
    }
  }
  
  /**
   * Append html to DOM depending on the orientation. Orientation is taken from options.
   *      
   * @param html
   *   HTML code to append to DOM.   
   */  
  $.fn.appendToDOM = function (html) {
    if (opt.orientation == "vertical" || opt.orientation == "v") {
      //$(this).wrap('<div>');
      $(this).after('<div css="display:block">'+html+'</div>');
    } else {
      //$('body').append(html);
      $(this).after(html);
    }
  }
  
  /**
   * Show current object using specified settings. Settings are taken from options.
   * 
   * jQuery UI can be used for effects.
   */    
  $.fn.showFX = function () {    
    //if jQuery UI used and effect exists  
    if(typeof $.fn.effect == 'function' && typeof $.effects[opt.showFX.fx] == 'function') {            
      $(this).effect(opt.showFX.fx,opt.showFX.settingsFX,opt.showFX.duration, opt.showFX.cb);
    } else {
      //Use default function shipped with jQuery
      $(this).fadeIn(opt.showFX.duration);
    }
  }
  
  /**
   * Hide current object using specified settings. Settings are taken from options.
   * 
   * jQuery UI can be used for effects.   
   */    
  $.fn.hideFX = function () {
    //if jQuery UI used and effect exists  
    if(typeof $.fn.effect == 'function' && typeof $.effects[opt.hideFX.fx] == 'function') {            
      $(this).effect(opt.hideFX.fx,opt.hideFX.settingsFX,opt.hideFX.duration, opt.hideFX.cb);
    } else {
      //Use default function shipped with jQuery
      $(this).fadeOut();
      $(this).hide();
    }
  }
  
  //PRIVATE 
  /**
   * Render Select element.
   *      
   * Default select text is taken from options.
   * Each rendered Select has a CSS class assigned. Class name is take from options.
   *
   * @param string selectID
   *   Source Select ID.
   *
   * @param string parentVal
   *   Parent Split Select selected value. 
   *
   * @todo Separate in render with internal data
   */ 
  function renderSelect(selectID, parentVal) {
    var o = "";
    if (!empty(SplitSelects[selectID][idx(parentVal)])) {
      //Default value
      o += '<select id="' + encodeID(selectID, parentVal) + '" class="'+opt.classname+'">';
      o += '<option value="">'+opt.defaultText+'</option>';
      for (var i in SplitSelects[selectID][idx(parentVal)]) {
        o += '<option value = "' + SplitSelects[selectID][idx(parentVal)][i] + '">';
        o += SplitSelects[selectID][idx(parentVal)][i];
        o += '</option>';
      }
      o += '</select>';
    }
    return o;
  }
  /**
   * Retrive concatenated text of all visible Split Selects of provided Source Select ID.
   *      
   * Concatenated text uses splitter specified in the options.   
   *
   * @param string id
   *   Source Select ID.
   *
   */ 
  function getConcatSelectedText(id) {
    var v = "";
    $('.' + opt.classname).not(':hidden').each(function () {
      if (decodeSourceID($(this).attr('id')) == id) {
        v += $(this).find(':selected').text() + opt.splitter;
      }
    });
    return v.substring(0, v.length - opt.splitter.length);
  }

  /**
   * Add Split Select to container of Split Selects.
   *      
   * Build internal dependencies between Split Selects.
   * Hashed Split Source Select text is used for internal indexing.
   * This method allows to minimize the quantity of objects by avoiding duplicates in texts.
   *
   * @param string srcSelectId   
   *  ID of Source Select in DOM.
   *   
   * @param array SplitTexts    
   *   Text values of levels - Split text of options from Source Select.   
   */ 
  function addSplitSelect(srcSelectId, SplitTexts) { 
    /*Internal format
      SplitSelects['orginal_select_id'][idx('parent_select_id')][idx('child_option')];
    */
    //Create Select object
    if (empty(SplitSelects[srcSelectId])) {
      SplitSelects[srcSelectId] = new Object();
    }
    
    //Traverse through all Split values
    for (var stk in SplitTexts) {
      var prevLevelText = ""; //Selected text on the previous level
      var currLevelText = SplitTexts[stk]; //Selected text on the current level
      if (stk == 0) {
        //Level 1
        prevLevelText = "root";
      } else {
        prevLevelText = SplitTexts[stk - 1];
      }

      if (empty(SplitSelects[srcSelectId][idx(prevLevelText)])) {
        SplitSelects[srcSelectId][idx(prevLevelText)] = new Object();
      }

      if (empty(SplitSelects[srcSelectId][idx(prevLevelText)][idx(currLevelText)])) {
        SplitSelects[srcSelectId][idx(prevLevelText)][idx(currLevelText)] = new Object();
      }
      SplitSelects[srcSelectId][idx(prevLevelText)][idx(currLevelText)] = currLevelText;
    }
  }

  /**
   * Encode ID and Val to stored in internal cache.
   *        
   * Uses delimiter specified in the options.
   *
   * @param string id
   *   DOM id of the Source Select.
   *   ID used along with Val to encode a unique id.
   *
   * @param string val
   *   Value of parent Split Select.
   *   Val used along with ID to encode a unique id.
   */
  function encodeID(id, val) {
    return id + delim + idx(val);
  }
  
  /**
   * Retrieves the Source Select ID from encoded id.
   *
   * @param string encodedID   
   *   Encoded DOM id of Split Select using function encodeID.
   */
  function decodeSourceID(encodedID) {
    return encodedID.substring(0, encodedID.indexOf(delim))
  }
  
  /**
   * Return the index of value in a hash table.
   *        
   * In case if value does not exist - create new record in hash table and return the index of new value.
   *
   * @param string s
   *   Value in a hash table.   
   */  
  function idx(s) {
    var idx = -1;
    for (var i in indexes) {    
      if (indexes[i] == s) {
        idx = i;
      }
    }
    //Add new record to hash table if value does not exist.
    if (idx < 0) {
      indexes.push(s);
      return indexes.length;
    }
    else {
      return idx;
    }
  }

  /**
   * Return the value of the item i in a hash table.
   *           
   * @param string i
   *   Index of the value in the hash table.
   */  
  function uidx(i) {
    if (!empty(indexes[i])) {
      return indexes[i];
    }    
    return "";
  }
  
  /**
   * Checks that argument is empty.
   *           
   * @param mixed mixed_var
   *   Argument to be checked.
   */    
  function empty (mixed_var) {
    // http://kevin.vanzonneveld.net
    // +   original by: Philippe Baumann
    // +      input by: Onno Marsman
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: LH
    // +   improved by: Onno Marsman
    // +   improved by: Francesco
    // +   improved by: Marc Jansen
    // +   input by: Stoyan Kyosev (http://www.svest.org/)
    // *     example 1: empty(null);
    // *     returns 1: true
    // *     example 2: empty(undefined);
    // *     returns 2: true
    // *     example 3: empty([]);
    // *     returns 3: true
    // *     example 4: empty({});
    // *     returns 4: true
    // *     example 5: empty({'aFunc' : function () { alert('humpty'); } });
    // *     returns 5: false
    
    var key;
    
    if (mixed_var === "" ||
        mixed_var === 0 ||
        mixed_var === "0" ||
        mixed_var === null ||
        mixed_var === false ||
        typeof mixed_var === 'undefined'
    ){
        return true;
    }

    if (typeof mixed_var == 'object') {
        for (key in mixed_var) {
            return false;
        }
        return true;
    }

    return false;
  }
})(jQuery);