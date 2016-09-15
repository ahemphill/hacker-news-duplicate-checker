// HN Duplicate Checker
// by Adam Hemphill
//
// This user script utilizes the API at https://hn.algolia.com/api to determine whether similar URLs have been submitted to Hacker News within the past year. It is a work in progress.

let hnDuplicateChecker = (function(){
  let input = document.querySelector( 'input[name=url]' ),
    elem = document.createElement( 'a' ),
    yearAgo = Math.floor( Date.now() / 1000 ) - 31540000,
    request;

  input.addEventListener( 'blur', getDuplicates );

  function getDuplicates(){
    elem.href = input.value;
    let host = elem.host,
      path = elem.pathname;
    if ( document.hasFocus() && host !== document.location.host ){
      request = new XMLHttpRequest();
      request.open( 'GET', `https://hn.algolia.com/api/v1/search_by_date?query=${host}${path}&restrictSearchableAttributes=url&tags=(story,show_hn)&numericFilters=created_at_i>${yearAgo}` );
      request.onreadystatechange = processDuplicates;
      request.send();
    }
  };

  function processDuplicates(){
    if ( request.readyState === XMLHttpRequest.DONE && request.status === 200 ){
      let prevDupes = document.getElementById( 'duplicates' ),
        response = JSON.parse( request.responseText ),
        tr = document.createElement( 'tr' ),
        inputParentTr = input.parentElement.parentElement;
        tr.id = 'duplicates';
      if ( prevDupes ){
        prevDupes.parentElement.removeChild( prevDupes )
      }
      for ( let i = 0; i < 2; i++ ){
        td = document.createElement( 'td' );
        tr.appendChild( td );
        switch ( i ) {
          case 0:
            td.innerText = 'dupes';
            break;
          case 1:
            td.innerText = `${response.nbHits} similar URLs have been submitted in the past year`;
            break;
        }
      }
      inputParentTr.parentElement.insertBefore( tr, inputParentTr.nextElementSibling );
    }
  };
})();
