"use client";

import { useMemo, useState } from "react";

const defaultLanguages = ["C++17", "C++20", "Java 17", "Python 3", "Go", "Rust"] as const;

const starters: Record<string, string> = {
  "C++17": `#include <bits/stdc++.h>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  return 0;
}`,
  "C++20": `#include <bits/stdc++.h>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  return 0;
}`,
  "Java 17": `import java.io.*;
import java.util.*;

public class Main {
  public static void main(String[] args) throws Exception {
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
  }
}`,
  "Python 3": `import sys

def main():
    data = sys.stdin.read().strip().split()

if __name__ == "__main__":
    main()`,
  Go: `package main

import (
  "bufio"
  "fmt"
  "os"
)

func main() {
  in := bufio.NewReader(os.Stdin)
  _ = in
  fmt.Println()
}`,
  Rust: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
}`,
};

type CodeWorkspaceProps = {
  language?: string;
  languages?: readonly string[];
  value?: string;
};

export function CodeWorkspace({ language = "C++17", languages = defaultLanguages, value = "" }: CodeWorkspaceProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const code = useMemo(() => {
    if (value && selectedLanguage === language) return value;
    return starters[selectedLanguage] ?? value ?? "// Editor integration lands in the workspace slice.";
  }, [language, selectedLanguage, value]);

  return (
    <section className="overflow-hidden rounded-[18px_6px_14px_6px] border border-soj-line/58 bg-soj-bg-raised/78 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soj-line/55 px-4 py-2">
        <h2 className="text-sm font-medium text-soj-text">Code workspace</h2>
        <label className="grid gap-1">
          <span className="sr-only">Language</span>
          <select
            aria-label="Language"
            className="soj-language-select"
            value={selectedLanguage}
            onChange={(event) => setSelectedLanguage(event.target.value)}
          >
            {languages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <pre className="min-h-64 overflow-auto bg-soj-bg/24 p-4 font-mono text-sm leading-6 text-soj-muted">
        <code>{code}</code>
      </pre>
    </section>
  );
}
