# Zoom API access, one hour at a time

Study notes. Not vendor documentation and not legal advice.

- The API reference says to obtain an access token with OAuth or server-to-server authentication.
- Requests go to the base URL https://api.zoom.us/v2/ with the token in the Authorization header.
- Methods named on that page are GET, POST, PATCH, PUT, and DELETE.
- The page says both OAuth styles provide access tokens valid for one hour.
- The sample token response on the page includes expires_in 3599.

Write the base URL, the header name, and the lifetime you read (one hour, and the sample expires_in 3599). Stop before you invent a scope. Open your app's scope list in the Zoom console you administer, which this lab cannot see.

