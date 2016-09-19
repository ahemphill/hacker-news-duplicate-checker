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
      request.open( 'GET', `https://hn.algolia.com/api/v1/search_by_date?query=${host}${path}&restrictSearchableAttributes=url&tags=(story,show_hn)&numericFilters=created_at_i>${yearAgo}&typoTolerance=false` );
      request.onreadystatechange = processDuplicates;
      request.send();
    }
  }

  function timeAgo( secondsThen, secondsNow = Math.floor( Date.now() / 1000 ), unit = 'day' ){
    //TODO: Return the largest unit without needing a parameter
    let secondsDiff = secondsNow - secondsThen,
      num, phrase,
      singular = 'a';
    switch ( unit ){
      case 'year':
        num = Math.floor( secondsDiff / 31540000 );
        break;
      case 'month':
        num = Math.floor( secondsDiff / 2628000 );
        break;
      case 'week':
        num = Math.floor( secondsDiff / 604800 );
        break;
      case 'day':
        num = Math.floor( secondsDiff / 86400 );
        break;
      case 'hour':
        num = Math.floor( secondsDiff / 3600 );
        singular = 'an';
        break;
      case 'minute':
        num = Math.floor( secondsDiff / 60 );
        break;
    }
    phrase = ( num <=1 ? singular : num ) + ` ${unit}` + ( num > 1 ? 's' : '');
    return [ num, phrase ];
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
              for ( let i = 0; /*hit.num_comments > 1 &&*/ i < response.nbHits; i++ ){
                let hit = response.hits[i];
                if ( typeof hit != 'undefined' ){
                  let li = document.createElement( 'li' ),
                    a = document.createElement( 'a' ),
                    a2 = document.createElement( 'a' );
                  a.href = `item?id=${hit.objectID}`;
                  a.style.cssText = 'color: #828282;';
                  a2.href = `${hit.url}`;
                  let noDub = a2.hostname.replace( /^(www\.)/, '' );
                  a.innerText = `${hit.title} [${noDub}] ( ${hit.points} points by ${hit.author} ${timeAgo( hit.created_at_i )[1]} ago | ${hit.num_comments} comments )`;
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
