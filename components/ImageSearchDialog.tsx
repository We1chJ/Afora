"use client"

import { useState, useCallback } from "react"
import { Search, Upload, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDropzone } from "react-dropzone"
import { Image } from "lucide-react"
import { searchPexelsImages } from "@/actions/actions"
import { toast } from "sonner"

export default function ImageSearchDialog() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState<string | null>("")
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>("")
    const [isDragging, setIsDragging] = useState(false)
    const [searchRes, setSearchRes] = useState<string[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        setUploadedFile(file)

        // Create preview URL for the image
        const previewUrl = URL.createObjectURL(file)
        setImagePreview(previewUrl)
    }, [])

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        noClick: true,
        noKeyboard: true,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
        },
        maxFiles: 1,
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
    })

    const searchImages = async () => {
        if (!searchQuery) return
        setIsLoading(true);
        setSearchRes([]);
        try {
            const response = await searchPexelsImages(searchQuery);
            console.log(response);
            if (response.success && response.urls) {
                setSearchRes(response.urls);
            } else {
                throw Error("Image Search Failed!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to search images. Please try again.");
        }

        setIsLoading(false)
    }

    const handleConfirm = () => {
        // Here you would typically upload the file to your server
        console.log("Uploading file:", uploadedFile)
        setUploadedFile(null)
        setImagePreview(null)
        setIsOpen(false)
    }

    const handleCancel = () => {
        setUploadedFile(null)
        setImagePreview(null)

        // Revoke the object URL to avoid memory leaks
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview)
        }
    }

    const handleClose = () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview)
        }
        // Reset all state variables
        setUploadedFile(null)
        setImagePreview("")
        setSearchQuery("")
        setIsLoading(false)
        setIsDragging(false)
        setIsOpen(false)
    }

    return (
        <>
            <button
                className="absolute bottom-4 right-4 bg-white bg-opacity-50 p-2 rounded-lg shadow-md flex items-center justify-center overflow-hidden transition-all duration-300 ease-in-out hover:w-36 w-10 text-black hover:bg-gray-100 group"
                onClick={() => setIsOpen(true)}
            >
                <div className="flex items-center w-full">
                    <Image size={20} className="flex-shrink-0" />
                    <span className="ml-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Change Image
                    </span>
                </div>
            </button>

            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        handleClose()
                    } else {
                        setIsOpen(true)
                    }
                }}
            >
                <DialogContent className="sm:max-w-[425px]" {...getRootProps()}>
                    <input {...getInputProps()} />
                    {uploadedFile ? (
                        <div className="text-center">
                            <div className="mb-4">
                                {imagePreview && (
                                    <div className="relative w-full max-h-48 overflow-hidden rounded-md mb-4">
                                        <img
                                            src={imagePreview || "/placeholder.svg"}
                                            alt="Preview"
                                            className="mx-auto object-contain max-h-48 w-full"
                                        />
                                    </div>
                                )}
                                <Check className="w-10 h-10 text-green-500 mx-auto mb-2" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">File Uploaded Successfully</h3>
                            <p className="mb-4 text-sm text-muted-foreground">{uploadedFile.name}</p>
                            <div className="flex justify-center space-x-4">
                                <Button onClick={handleConfirm}>Confirm</Button>
                                <Button variant="outline" onClick={handleCancel}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className={`transition-all duration-300 ${isDragActive ? "bg-primary/10 border-primary" : ""}`}>
                            <DialogHeader>
                                <DialogTitle className="flex justify-between items-center">
                                    <span>Search Images</span>
                                    <a href="https://www.pexels.com" className="mr-4">
                                        <img src="https://images.pexels.com/lib/api/pexels.png" alt="Pexels" className="inline-block h-6" />
                                    </a>
                                </DialogTitle>
                            </DialogHeader>
                            <div className="flex items-center space-x-2 my-2">
                                <Button variant="outline" size="icon" onClick={searchImages}>
                                    <Search className="h-4 w-4" />
                                </Button>
                                <Input
                                    placeholder="Search images..."
                                    className="flex-grow"
                                    value={searchQuery || ""}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {isLoading || searchRes.length == 0 ? (
                                    [...Array(9)].map((_, i) => (
                                        <div key={i} className="bg-muted rounded-md aspect-square animate-pulse" />
                                    ))
                                ) : (
                                    searchRes.map((url, i) => (
                                        <div key={i} className="bg-muted rounded-md aspect-square overflow-hidden">
                                            <img
                                                src={url}
                                                alt={`Search result ${i + 1}`}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    open()
                                }}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Image
                            </Button>
                            {isDragActive && (
                                <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                                    <p className="text-lg font-semibold">Drop your image here</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

