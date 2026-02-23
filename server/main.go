// Copyright 2026 AdverXarial, byt3n33dl3.
//
// Licensed under the MIT License,
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

package main

import (
	"fmt"
	"log"
	"net/http"
)

func addHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		next.ServeHTTP(w, r)
	})
}

func main() {
	fs := http.FileServer(http.Dir("../static"))
	http.Handle("/", addHeaders(fs))

	port := ":6060"
	fmt.Printf("\nBloodPengu running on http://localhost%s\n\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
