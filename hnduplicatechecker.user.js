// ==UserScript==
// @name         Hacker News Duplicate Checker
// @namespace    http://ahemphill.net/
// @version      0.9.0
// @description  Check for duplicate submissions on Hacker News (https://news.ycombinator.com/)
// @author       Adam Hemphill
// @homepage     http://ahemphill.net/hacker-news-duplicate-checker/
// @match        https://news.ycombinator.com/submit
// ==/UserScript==

let hnDuplicateChecker = (function(){

  'use strict';

  let input = document.querySelector( 'input[name=url]' ),
    elem = document.createElement( 'a' ),
    secondsNow = Math.floor( Date.now() / 1000 ),
    yearAgo = secondsNow - 31540000,
    request;

  input.addEventListener( 'blur', getDuplicates );

  function getDuplicates(){
    elem.href = input.value.includes( '//' ) ? input.value : '//' + input.value; // Hacky way to ensure protocol exists so elem.href is not relative to document.location.host
    let host = elem.host,
      path = elem.pathname;
    if ( document.hasFocus() && host !== document.location.host ){
      request = new XMLHttpRequest();
      // TODO: Add query string matching (e.g. http://appft.uspto.gov/netacgi/nph-Parser?Sect1=PTO1&Sect2=HITOFF&d=PG01&p=1&u=%2Fnetahtml%2FPTO%2Fsrchnum.html&r=1&f=G&l=50&s1=%2220160264304%22.PGNR.&OS=DN%2F20160264304&RS=DN%2F20160264304)
      request.open( 'GET', `https://hn.algolia.com/api/v1/search_by_date?query=${host}${path}&restrictSearchableAttributes=url&tags=(story,show_hn)&numericFilters=created_at_i>${yearAgo}&typoTolerance=false` );
      request.onreadystatechange = processDuplicates;
      request.send();
    }
  }

  function timeAgo( secondsThen, secondsNow = Math.floor( Date.now() / 1000 ) ){
    let secondsDiff = secondsNow - secondsThen,
      unit = 'second',
      singular = 'a';
    if ( secondsDiff < 60 ) {
      return phrase( secondsDiff );
    }
    let minsDiff = Math.floor( secondsDiff / 60 );
    unit = 'minute';
    if ( minsDiff < 60 ){
      return phrase( minsDiff );
    }
    let hoursDiff = Math.floor( secondsDiff / 3600 );
    unit = 'hour';
    if ( hoursDiff < 24 ){
      singular = 'an';
      return phrase( hoursDiff );
    }
    let daysDiff = Math.floor( secondsDiff / 86400 );
    unit = 'day';
    if ( daysDiff < 7 ){
      return phrase( daysDiff );
    }
    let weeksDiff = Math.floor( secondsDiff / 604800 );
    unit = 'week';
    if ( weeksDiff < 4 ){
      return phrase( weeksDiff );
    }
    let monthsDiff = Math.floor( secondsDiff / 2628000 );
    unit = 'month';
    if ( monthsDiff < 12 ){
      return phrase( monthsDiff );
    }
    let yearsDiff = Math.floor( secondsDiff / 31540000);
    unit = 'year';
    return phrase( yearsDiff );

    function phrase( unitDiff ){
      let unitAgo = `${singular} ${unit} ago`;
      if ( unitDiff < 0 ){
        return 'the future';
      } else if ( unitDiff < 1 ) {
        return `less than ${unitAgo}`;
      } else if ( unitDiff === 1 ){
        return `${unitAgo}`;
      } else {
        return `${unitDiff} ${unit}s ago`;
      }
    }
  }

  function processDuplicates(){
    if ( request.readyState === XMLHttpRequest.DONE && request.status === 200 ){
      let prevDupes = document.getElementById( 'duplicates' ),
        response = JSON.parse( request.responseText ),
        tr = document.createElement( 'tr' ),
        inputParentTr = input.parentElement.parentElement;
        tr.id = 'duplicates';
      if ( prevDupes ){
        prevDupes.parentElement.removeChild( prevDupes );
      }
      if ( response.nbHits > 0 && response.hits[0]._highlightResult.url.matchLevel === 'full' ){
        for ( let i = 0; i < 2; i++ ){
          let td = document.createElement( 'td' );
          tr.appendChild( td );
          switch ( i ) {
            case 0:
              td.innerText = 'dupes';
              break;
            case 1:
              let ul = document.createElement( 'ul' );
              for ( let i = 0; /*hit.num_comments > 1 &&*/ i < response.nbHits && i < 5; i++ ){
                let hit = response.hits[i];
                if ( typeof hit != 'undefined' ){
                  let li = document.createElement( 'li' ),
                    a = document.createElement( 'a' ),
                    a2 = document.createElement( 'a' );
                  a.href = `item?id=${hit.objectID}`;
                  a.style.cssText = 'color: #828282;';
                  a2.href = `${hit.url}`;
                  let noDub = a2.hostname.replace( /^(www\.)/, '' );
                  a.innerText = `${hit.title} [${noDub}] ( ${hit.points} points by ${hit.author} ${timeAgo( hit.created_at_i )} | ${hit.num_comments} comments )`;
                  li.appendChild( a );
                  ul.appendChild( li );
                  ul.style.cssText = 'list-style-type: none; padding-left: 0; margin: 0;';
                }
              }
            td.appendChild( ul );
            break;
          }
        }
        inputParentTr.parentElement.insertBefore( tr, inputParentTr.nextElementSibling );
      }
    }
  }
})();
