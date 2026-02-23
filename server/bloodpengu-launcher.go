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
	"os/exec"
	"runtime"
	"time"
)

func main() {
	port := ":6060"
	url := "http://localhost" + port

	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", fs)

	fmt.Println("BloodPengu: Degree Visualization of Linux ASR")
	fmt.Printf("Starting server on %s\n", url)
	fmt.Println("Opening browser...")
	fmt.Println("\nPress Ctrl+C to stop")

	go func() {
		time.Sleep(500 * time.Millisecond)
		openBrowser(url)
	}()

	log.Fatal(http.ListenAndServe(port, nil))
}

func openBrowser(url string) {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "linux":
		cmd = exec.Command("xdg-open", url)
	case "darwin":
		cmd = exec.Command("open", url)
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", url)
	default:
		fmt.Printf("Please open manually: %s\n", url)
		return
	}

	err := cmd.Start()
	if err != nil {
		fmt.Printf("Could not open browser automatically. Please open: %s\n", url)
	}
}