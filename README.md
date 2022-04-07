# CSC3916_HW5

## React Website Hosted At
https://hw5-movies.herokuapp.com/

---

### Some implementation notes
- Right now, if there is a validation error with the record during a post or put, it will return the message from the mongodb error.
- Titles for movies must be unique. This is because it is what we are using to identify them right now, so I opted for preventing undefined behavior by simply making them unique.

