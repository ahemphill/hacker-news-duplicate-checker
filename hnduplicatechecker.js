let hnDuplicateChecker = (function(){
  let input = document.querySelector( 'input[name=url]' ),
    elem = document.createElement( 'a' ),
    yearAgo = Math.floor( Date.now() / 1000 ) - 31540000,
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
      if ( response.nbHits > 0 ){
        for ( let i = 0; i < 2; i++ ){
          td = document.createElement( 'td' );
          tr.appendChild( td );
          switch ( i ) {
            case 0:
              td.innerText = 'dupes';
              break;
            case 1:
              // TODO: Filter on hit._highlightResult.fullyHighlighted == true, num_comments > 1; calculate timeAgo; style
              ul = document.createElement( 'ul' );
              for ( let i = 0; i < 5; i++ ){ // TODO: Add <5 failsafe
                let li = document.createElement( 'li' ),
                  a = document.createElement( 'a' ),
                  hit = response.hits[i],
                  timeAgo = 'someTime';
                a.href = `item?id=${hit.objectID}`;
                a.innerText = `${hit.title} (${hit.points} points by ${hit.author} ${timeAgo} ago | ${hit.num_comments} comments)`;
                li.appendChild( a );
                ul.appendChild( li );
              }
              td.appendChild( ul );
              // td.innerText = `${response.nbHits} similar URLs have been submitted in the past year`;
              break;
          }
        }
        inputParentTr.parentElement.insertBefore( tr, inputParentTr.nextElementSibling );
      }
    }
  }
})();
